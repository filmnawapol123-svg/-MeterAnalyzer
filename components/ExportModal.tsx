import React, { useState, useEffect } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialValue: string;
  fileExtension?: string;
  title: string;
  saveButtonText: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onSave, initialValue, fileExtension, title, saveButtonText }) => {
  const [name, setName] = useState(initialValue);

  useEffect(() => {
    if(isOpen) {
        setName(initialValue);
    }
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSave();
    }
    if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="flex items-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
          {fileExtension && (
            <span className="p-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600">
                .{fileExtension}
            </span>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {saveButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
