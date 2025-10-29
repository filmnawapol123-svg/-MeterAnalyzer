
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">กำลังวิเคราะห์ข้อมูล... กรุณารอสักครู่</p>
    </div>
  );
};

export default LoadingSpinner;
