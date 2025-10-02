import React, { useRef } from 'react';

interface ImageUploadZoneProps {
  onImageUpload: (file: File) => void;
  isUploading: boolean;
}

export function ImageUploadZone({ onImageUpload, isUploading }: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-gray-50"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-3">
        <div className="text-6xl">
          {isUploading ? '⏳' : '📷'}
        </div>
        
        <div>
          <p className="text-lg font-semibold text-gray-900 mb-1">
            {isUploading ? 'Uploading...' : 'Upload X-ray Image'}
          </p>
          <p className="text-sm text-gray-600">
            Click to browse or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPEG, PNG, BMP, TIFF (Max 20MB)
          </p>
        </div>
      </div>
    </div>
  );
}