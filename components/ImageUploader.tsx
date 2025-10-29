
import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageChange: (file: File | null) => void;
  imageUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imageUrl }) => {
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      {imageUrl ? (
        <div className="relative group">
          <img src={imageUrl} alt="Preview" className="w-full h-auto rounded-lg shadow-md object-contain max-h-[60vh]" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
            <button
              onClick={handleClearImage}
              className="bg-white text-red-600 font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-red-50 transition-transform transform hover:scale-105"
            >
              ลบรูปภาพ
            </button>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default ImageUploader;
