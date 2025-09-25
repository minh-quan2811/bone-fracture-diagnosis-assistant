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