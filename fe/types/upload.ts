// Upload status
export interface UploadStatusDisplayProps {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  fileName?: string;
}

// Document Upload
export interface DocumentUpload {
  id: number;
  user_id: number;
  filename: string;
  file_type: string | null;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}
