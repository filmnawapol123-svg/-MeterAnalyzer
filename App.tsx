import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultsTable from './components/ResultsTable';
import LoadingSpinner from './components/LoadingSpinner';
import { analyzeMeterImage } from './services/geminiService';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult[] | null>(null);

  const handleImageChange = useCallback((file: File | null) => {
    setError(null);
    setAnalysisResult(null);
    setImageFile(file);
    if (file) {
      setImageUrl(URL.createObjectURL(file));
    } else {
      setImageUrl(null);
    }
  }, []);

  const handleAnalyzeClick = async () => {
    if (!imageFile) {
      setError("กรุณาเลือกรูปภาพก่อนทำการวิเคราะห์");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeMeterImage(imageFile);
      setAnalysisResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่คาดคิด");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8 no-print">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
          เครื่องมือวิเคราะห์ค่ามิเตอร์ไฟฟ้า
        </h1>
        <p className="mt-2 text-md sm:text-lg text-gray-600 max-w-3xl">
          อัปโหลดรูปภาพตารางค่ามิเตอร์ไฟฟ้าของคุณเพื่อตรวจสอบความถูกต้องของการคำนวณโดยอัตโนมัติด้วย Gemini AI
        </p>
      </header>
      
      <main className="w-full flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg border border-gray-200 no-print">
            <ImageUploader onImageChange={handleImageChange} imageUrl={imageUrl} />
            
            {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
                {error}
                </div>
            )}

            <div className="mt-6 flex justify-center">
                <button
                onClick={handleAnalyzeClick}
                disabled={!imageFile || isLoading}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                >
                {isLoading ? (
                    <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังวิเคราะห์...</span>
                    </>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>วิเคราะห์รูปภาพ</span>
                    </>
                )}
                </button>
            </div>
        </div>

        {isLoading && (
            <div className="mt-8 no-print">
                <LoadingSpinner />
            </div>
        )}
        
        {analysisResult && (
          <div className="mt-8 w-full">
            <ResultsTable results={analysisResult} />
          </div>
        )}
      </main>

      <footer className="text-center text-gray-500 text-sm mt-12 no-print">
        <p>ขับเคลื่อนโดย Google Gemini API</p>
      </footer>
    </div>
  );
};

export default App;