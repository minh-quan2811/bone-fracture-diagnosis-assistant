export interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
  sender_id?: number;
}
