import { Message } from "@/types";
import { AuthService } from "./authService";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Message Service
 * Handles message API operations
 */

export class MessageService {
  /**
   * Fetch messages for a specific conversation
   */
  static async fetchMessages(conversationId: number, token: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch messages");
    }

    return res.json();
  }

  /**
   * Send a message to a conversation
   * Fetches user role automatically
   */
  static async sendMessage(
    conversationId: number,
    content: string,
    token: string
  ): Promise<Message[]> {
    // Fetch user data to get role
    const userInfo = await AuthService.fetchUser(token);
    const role = userInfo.role;

    const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        role: role,
        content,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to send message");
    }

    return res.json();
  }
}
