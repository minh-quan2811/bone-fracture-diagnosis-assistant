export interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
  sender_id?: number;
}

// Base conversation without messages
export interface ConversationBase {
  id: number;
  title: string;
  created_at: string;
}

// Full conversation with messages
export interface Conversation extends ConversationBase {
  messages: Message[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

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