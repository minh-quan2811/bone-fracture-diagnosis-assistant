// Base conversation without messages
export interface ConversationBase {
  id: number;
  title: string;
  created_at: string;
}

// Full conversation with messages
export interface Conversation extends ConversationBase {
  messages: import('./message').Message[];
}
