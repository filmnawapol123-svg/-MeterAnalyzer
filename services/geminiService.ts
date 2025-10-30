import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

/**
 * Resizes and compresses an image file.
 * @param file The image file to process.
 * @param maxSize The maximum width or height of the image.
 * @param quality The JPEG quality (0 to 1).
 * @returns A promise that resolves with the processed image file.
 */
const resizeAndCompressImage = (file: File, maxSize: number, quality: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error('Failed to read file.'));
      }
      const img = new Image();
      img.src = event.target.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '.jpeg';
              const newFile = new File([blob], newFileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const analysisSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      condition: {
        type: Type.STRING,
        description: 'เงื่อนไขการตรวจสอบ เช่น "007+008+009 = 006"'
      },
      calculation: {
        type: Type.STRING,
        description: 'สมการที่คำนวณจากค่าที่อ่านได้ ไม่รวมผลลัพธ์ เช่น "402+396+559"'
      },
      actualResult: {
        type: Type.STRING,
        description: 'ผลลัพธ์ที่ได้จากการคำนวณ'
      },
      expectedValue: {
        type: Type.STRING,
        description: 'ค่าที่ควรจะเป็นตามที่อ่านได้จากตาราง'
      },
      status: {
        type: Type.BOOLEAN,
        description: 'สถานะ: true ถ้าผ่าน, false ถ้าไม่ผ่าน'
      },
      reason: {
        type: Type.STRING,
        description: 'หากไม่ผ่านเพราะผลการคำนวณไม่ตรงกับค่าที่คาดหวัง ให้ปล่อยเป็นค่าว่าง แต่หากไม่ผ่านเพราะไม่สามารถอ่านค่าได้ ให้ระบุว่า "ไม่สามารถอ่านค่าได้"'
      }
    },
    required: ['condition', 'calculation', 'actualResult', 'expectedValue', 'status']
  }
};


export const analyzeMeterImage = async (imageFile: File): Promise<AnalysisResult[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API key not found. Please set the API_KEY environment variable.");
  }

  // Resize and compress the image before sending to the API
  const processedImageFile = await resizeAndCompressImage(imageFile, 1024, 0.7);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(processedImageFile);

  const prompt = `วิเคราะห์รูปภาพตารางข้อมูลการอ่านค่ามิเตอร์ไฟฟ้าที่แนบมา และตรวจสอบความถูกต้องของค่าตามเงื่อนไขต่อไปนี้:
1.  **แถว 007, 008, 009:** นำค่ามาบวกกัน ผลรวมต้องเท่ากับค่าใน **แถว 006**
2.  **แถว 013:** นำค่าบนลบค่าล่าง ผลลัพธ์ต้องเท่ากับค่าใน **แถว 010**
3.  **แถว 014:** นำค่าบนลบค่าล่าง ผลลัพธ์ต้องเท่ากับค่าใน **แถว 011**
4.  **แถว 015:** นำค่าบนลบค่าล่าง ผลลัพธ์ต้องเท่ากับค่าใน **แถว 012**

โปรดอ่านค่าตัวเลขจากภาพอย่างละเอียดและแม่นยำ
สำหรับผลลัพธ์ ให้ตอบกลับในรูปแบบ JSON ที่สอดคล้องกับ schema ที่กำหนดเท่านั้น
สำหรับฟิลด์ 'reason': หากการตรวจสอบไม่ผ่านเพราะผลการคำนวณไม่ตรงกับค่าที่คาดหวัง ให้ปล่อยฟิลด์นี้เป็นค่าว่าง (empty string) แต่หากไม่ผ่านเพราะไม่สามารถอ่านค่าตัวเลขได้ ให้ระบุว่า "ไม่สามารถอ่านค่าได้"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as AnalysisResult[];

    // Post-process the 'calculation' field to ensure it doesn't contain the result.
    // This provides robustness in case the model doesn't strictly follow the prompt.
    const processedResult = result.map(item => ({
        ...item,
        calculation: item.calculation.split('=')[0].trim()
    }));

    return processedResult;

  } catch (error) {
    console.error("Error analyzing image with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`เกิดข้อผิดพลาดในการวิเคราะห์รูปภาพ: ${error.message}`);
    }
    throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการวิเคราะห์รูปภาพ");
  }
};