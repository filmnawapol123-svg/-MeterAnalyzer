import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultsTable from './components/ResultsTable';
import LoadingSpinner from './components/LoadingSpinner';
import SavedSessionsList from './components/SavedSessionsList';
import ExportModal from './components/ExportModal';
import { analyzeMeterImage } from './services/geminiService';
import { AnalysisResult, SavedSession } from './types';

const LOCAL_STORAGE_KEY = 'electric-meter-analysis-history';

/**
 * Creates a resized and compressed base64 data URL from an image file.
 * @param file The image file to process.
 * @param maxSize The maximum width or height of the image.
 * @param quality The JPEG quality (0 to 1).
 * @returns A promise that resolves with the base64 data URL.
 */
const createImageThumbnail = (file: File, maxSize: number = 800, quality: number = 0.7): Promise<string> => {
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
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult[] | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSessions) {
        setSavedSessions(JSON.parse(storedSessions));
      }
    } catch (error) {
      console.error("Failed to load sessions from local storage", error);
      // Handle potential corrupted data by clearing it
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, []);

  const updateStorage = (sessions: SavedSession[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to local storage", error);
    }
  };

  const handleImageChange = useCallback((file: File | null) => {
    setError(null);
    setAnalysisResult(null);
    setImageFile(file);
    setActiveSessionId(null);
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
    setActiveSessionId(null);

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
  
  const handleSaveSession = async (name: string) => {
    if (!analysisResult) return;

    let thumbnail: string | undefined = undefined;
    if (imageFile) {
      try {
        thumbnail = await createImageThumbnail(imageFile);
      } catch (error) {
        console.error("Failed to create image thumbnail for session:", error);
      }
    }

    const newSession: SavedSession = {
      id: Date.now().toString(),
      name,
      timestamp: new Date().toISOString(),
      results: analysisResult,
      imageDataUrl: thumbnail,
    };
    const updatedSessions = [newSession, ...savedSessions];
    setSavedSessions(updatedSessions);
    updateStorage(updatedSessions);
    setActiveSessionId(newSession.id);
    setIsSaveModalOpen(false);
  };

  const handleLoadSession = (sessionId: string) => {
    const session = savedSessions.find(s => s.id === sessionId);
    if (session) {
      setAnalysisResult(session.results);
      setActiveSessionId(session.id);
      setImageUrl(session.imageDataUrl || null);
      // Clear current image analysis state
      setImageFile(null);
      setError(null);
      setIsLoading(false);
    }
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    const updatedSessions = savedSessions.map(s => 
      s.id === sessionId ? { ...s, name: newName } : s
    );
    setSavedSessions(updatedSessions);
    updateStorage(updatedSessions);
  };
  
  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = savedSessions.filter(s => s.id !== sessionId);
    setSavedSessions(updatedSessions);
    updateStorage(updatedSessions);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setAnalysisResult(null);
      setImageUrl(null);
    }
  };

  const handleAnalyzeNew = () => {
    handleImageChange(null);
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="flex flex-col items-center p-4 sm:p-6 md:p-8 overflow-y-auto">
        <header className="text-center mb-8 no-print w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            เครื่องมือวิเคราะห์ค่ามิเตอร์ไฟฟ้า (Electric Meter Analyzer)
          </h1>
          <p className="mt-2 text-md sm:text-lg text-gray-600 max-w-3xl mx-auto">
            อัปโหลดรูปภาพตารางค่ามิเตอร์ไฟฟ้าของคุณเพื่อตรวจสอบความถูกต้องของการคำนวณโดยอัตโนมัติด้วย Gemini AI
          </p>
        </header>
        
        <main className="w-full flex flex-col items-center">
          {activeSessionId === null ? (
             <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg border border-gray-200 no-print">
                <ImageUploader onImageChange={handleImageChange} imageUrl={imageUrl} fileName={imageFile?.name} />
                
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>วิเคราะห์รูปภาพ</span>
                        </>
                    )}
                    </button>
                </div>
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto mb-4 no-print">
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg flex items-center justify-between shadow-md">
                <div>
                  <p className="font-bold">กำลังแสดงผลการวิเคราะห์ที่บันทึกไว้:</p>
                  <p className="font-medium">{savedSessions.find(s => s.id === activeSessionId)?.name}</p>
                </div>
                <button
                  onClick={handleAnalyzeNew}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                >
                  วิเคราะห์รายการใหม่
                </button>
              </div>
                {imageUrl && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">รูปภาพที่เกี่ยวข้อง</h3>
                        <div className="relative group border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50 max-w-2xl mx-auto">
                            <img 
                                src={imageUrl} 
                                alt="รูปภาพที่บันทึกไว้" 
                                className="w-full h-auto max-h-[400px] object-contain p-2" 
                            />
                        </div>
                    </div>
                )}
            </div>
          )}

          {isLoading && (
              <div className="mt-8 no-print">
                  <LoadingSpinner />
              </div>
          )}
          
          {analysisResult && (
            <div className="mt-8 w-full">
              <ResultsTable 
                results={analysisResult} 
                onSaveSession={() => setIsSaveModalOpen(true)}
              />
              <div className="mt-6 w-full max-w-5xl mx-auto p-4 bg-red-100 border-2 border-red-400 text-red-800 rounded-lg text-center" role="alert">
                <p className="font-bold text-lg">
                  โปรดตรวจสอบข้อมูลให้ถูกต้องก่อนนำไปใช้งาน
                </p>
              </div>
            </div>
          )}

          {savedSessions.length > 0 && (
             <div className="mt-8 w-full">
                <SavedSessionsList
                    sessions={savedSessions}
                    activeSessionId={activeSessionId}
                    onLoad={handleLoadSession}
                    onRename={handleRenameSession}
                    onDelete={handleDeleteSession}
                />
             </div>
          )}
        </main>

        <footer className="text-center text-gray-500 text-sm mt-12 no-print">
          <p>Powered by Google Gemini API</p>
        </footer>
      </div>
      
      <ExportModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveSession}
        initialValue={`ผลวิเคราะห์ - ${new Date().toLocaleString('th-TH')}`}
        title="บันทึกผลการวิเคราะห์"
        saveButtonText="บันทึก"
      />
    </div>
  );
};

export default App;