import { useRef } from 'react';
import { Upload } from 'lucide-react';

interface DocumentUploadButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function DocumentUploadButton({ 
  onFileSelect, 
  disabled = false,
  className = ""
}: DocumentUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors ${
          disabled 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        } ${className}`}
        title="Upload document (PDF, DOCX)"
        aria-label="Upload document"
      >
        <Upload className="w-5 h-5" />
      </button>
    </>
  );
}