import { useState } from 'react';
import { DocumentUploadButton } from './DocumentUploadButton';
import { UploadService } from '@/services/uploadService';

interface DocumentUpload {
  id: number;
  user_id: number;
  filename: string;
  file_type: string | null;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

interface DocumentUploadProps {
  token: string;
  onUploadSuccess?: (response: DocumentUpload) => void;
  onUploadError?: (error: string) => void;
  onUploadStart?: (filename: string) => void;
  className?: string;
  collectionName?: string;
  indexId?: string;
}

export function DocumentUpload({ 
  token, 
  onUploadSuccess,
  onUploadError,
  onUploadStart,
  className = "",
  collectionName = "medical_documents",
  indexId = "medical_doc_index"
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload PDF or DOCX files only.';
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 10MB.';
    }
    
    return null;
  };

  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      onUploadError?.(validationError);
      return;
    }

    setIsUploading(true);
    onUploadStart?.(file.name);

    try {
      const response = await UploadService.uploadDocument(file, token, collectionName, indexId);
      onUploadSuccess?.(response);
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      <DocumentUploadButton 
        onFileSelect={handleFileSelect}
        disabled={isUploading}
      />
    </div>
  );
}