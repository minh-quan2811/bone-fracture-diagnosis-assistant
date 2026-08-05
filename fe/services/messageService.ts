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
   * Stream a message response from the server using Server-Sent Events.
   *
   * The backend must send newline-delimited JSON events in this format:
   *   data: {"type": "node",  "node": "classify"}   <- LangGraph node started
   *   data: {"type": "token", "content": "Hello"}   <- one streamed token
   *   data: {"type": "done"}                        <- stream finished
   *
   * Backend endpoint: POST /chat/conversations/{id}/messages/stream
   */
  static async streamMessage(
    conversationId: number,
    content: string,
    token: string,
    onNode: (node: string) => void,
    onToken: (chunk: string) => void
  ): Promise<void> {
    const userInfo = await AuthService.fetchUser(token);
    const role = userInfo.role;

    const res = await fetch(
      `${API_BASE}/chat/conversations/${conversationId}/messages/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role, content }),
      }
    );

    if (!res.ok || !res.body) {
      throw new Error("Stream request failed");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Accumulate chunks — a single read() may contain partial or multiple events
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines; split on single newlines for lines
      const lines = buffer.split("\n");

      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        // SSE lines carrying data start with "data: "
        if (!line.startsWith("data: ")) continue;

        const raw = line.slice(6).trim();
        if (!raw || raw === "[DONE]") continue;

        try {
          const event = JSON.parse(raw) as
            | { type: "node"; node: string }
            | { type: "token"; content: string }
            | { type: "done" };

          if (event.type === "node") onNode(event.node);
          else if (event.type === "token") onToken(event.content);
        } catch {
          // Silently skip any malformed event lines
        }
      }
    }
  }
}