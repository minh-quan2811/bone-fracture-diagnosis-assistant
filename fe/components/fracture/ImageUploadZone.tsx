import React, { useRef } from 'react';

interface ImageUploadZoneProps {
  onImageUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  disabled?: boolean;
}

export function ImageUploadZone({ onImageUpload, isUploading, disabled = false }: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onImageUpload(file);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading || disabled}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || disabled}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400"
      >
        {isUploading ? (
          <>⏳ Uploading...</>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload X-ray Image
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 mt-1 text-center">
        JPEG, PNG, BMP, TIFF (max 20MB)
      </p>
    </div>
  );
}