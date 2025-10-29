import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

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
        description: 'เหตุผลสั้นๆ หากไม่ผ่าน (เป็นภาษาไทย)'
      }
    },
    required: ['condition', 'calculation', 'actualResult', 'expectedValue', 'status']
  }
};


export const analyzeMeterImage = async (imageFile: File): Promise<AnalysisResult[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API key not found. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `วิเคราะห์รูปภาพตารางข้อมูลการอ่านค่ามิเตอร์ไฟฟ้าที่แนบมา และตรวจสอบความถูกต้องของค่าตามเงื่อนไขต่อไปนี้:
1.  **แถว 007, 008, 009:** นำค่ามาบวกกัน ผลรวมต้องเท่ากับค่าใน **แถว 006**
2.  **แถว 013:** นำค่าบนลบค่าล่าง ผลลัพธ์ต้องเท่ากับค่าใน **แถว 010**
3.  **แถว 014:** นำค่าบนลบค่าล่าง ผลลัพธ์ต้องเท่ากับค่าใน **แถว 011**
4.  **แถว 015:** นำค่าบนลบค่าล่าง ผลลัพธ์ต้องเท่ากับค่าใน **แถว 012**

โปรดอ่านค่าตัวเลขจากภาพอย่างละเอียดและแม่นยำ หากไม่สามารถอ่านค่าได้ ให้ระบุในผลลัพธ์ว่าเป็น "ไม่สามารถอ่านค่าได้"
สำหรับผลลัพธ์ ให้ตอบกลับในรูปแบบ JSON ที่สอดคล้องกับ schema ที่กำหนดเท่านั้น`;

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