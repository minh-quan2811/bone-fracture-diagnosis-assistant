import { Conversation, ConversationBase } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Conversation Service
 * Handles conversation API operations
 */

export class ConversationService {
  /**
   * Fetch all conversations for the user
   */
  static async fetchConversations(token: string): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch conversations");
    }

    return res.json();
  }

  /**
   * Create a new conversation
   */
  static async createConversation(title: string, token: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      throw new Error("Failed to create conversation");
    }

    return res.json();
  }
}
