import { useState } from 'react';
import { DocumentUploadButton } from './DocumentUploadButton';
import { UploadStatusDisplay } from './UploadStatusDisplay';
import { uploadDocument } from '@/lib/upload';

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
  className?: string;
  collectionName?: string;
  indexId?: string;
}

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
}

export function DocumentUpload({ 
  token, 
  onUploadSuccess,
  onUploadError,
  className = "",
  collectionName = "medical_documents",
  indexId = "medical_doc_index"
}: DocumentUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ status: 'idle' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    const error = validateFile(file);
    
    if (error) {
      setUploadStatus({ status: 'error', message: error });
      onUploadError?.(error);
      setTimeout(() => setUploadStatus({ status: 'idle' }), 5000);
      return;
    }

    setSelectedFile(file);
    setUploadStatus({ 
      status: 'uploading', 
      message: 'Processing document...' 
    });

    try {
      const response = await uploadDocument(file, token, collectionName, indexId);
      
      setUploadStatus({ 
        status: 'success', 
        message: `Document uploaded successfully. Status: ${response.status}` 
      });
      
      onUploadSuccess?.(response);
      
      setTimeout(() => {
        setUploadStatus({ status: 'idle' });
        setSelectedFile(null);
      }, 5000);
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload document';
      setUploadStatus({ 
        status: 'error', 
        message: errorMessage 
      });
      
      onUploadError?.(errorMessage);
      
      setTimeout(() => {
        setUploadStatus({ status: 'idle' });
        setSelectedFile(null);
      }, 8000);
    }
  };

  return (
    <div className={className}>
      {uploadStatus.status !== 'idle' && (
        <div className="mb-3">
          <UploadStatusDisplay 
            status={uploadStatus.status}
            message={uploadStatus.message}
            fileName={selectedFile?.name}
          />
        </div>
      )}
      
      <DocumentUploadButton 
        onFileSelect={handleFileSelect}
        disabled={uploadStatus.status === 'uploading'}
      />
    </div>
  );
}