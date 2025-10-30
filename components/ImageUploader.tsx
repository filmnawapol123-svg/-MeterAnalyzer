import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageChange: (file: File | null) => void;
  imageUrl: string | null;
  fileName?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imageUrl, fileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onImageChange(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0] || null;
    onImageChange(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleClearImage = () => {
    onImageChange(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  if (imageUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center animate-fade-in">
        <div className="relative group border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="w-full h-auto max-h-[400px] object-contain p-2" 
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button
              onClick={handleClearImage}
              title="ลบรูปภาพ"
              className="p-3 text-white bg-red-600 bg-opacity-80 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-red-500 transition-all transform hover:scale-110"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-4">
            <p className="font-semibold text-gray-800 truncate" title={fileName}>{fileName || 'รูปภาพที่เลือก'}</p>
            <button 
                onClick={handleBrowseClick}
                className="mt-1 text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
                เปลี่ยนรูปภาพ
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
            />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        onClick={handleBrowseClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        <div className="flex flex-col items-center justify-center text-gray-500">
           <svg className="w-12 h-12 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-lg"><span className="font-semibold">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง</p>
          <p className="text-sm">รองรับไฟล์ PNG, JPG หรือ WEBP</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;