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
      className="w-full border-2 border-dashed border-[var(--color-border)] rounded-lg p-12 text-center cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-lightest)] transition-colors bg-[var(--color-surface)]"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-3">
        <svg className="w-16 h-16 text-[var(--color-primary)] opacity-60" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        
        <div>
          <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
            {isUploading ? 'Uploading...' : 'Upload X-ray Image'}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Click to browse or drag and drop
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
            Supported formats: JPEG, PNG, BMP, TIFF (Max 20MB)
          </p>
        </div>
      </div>
    </div>
  );
}