import { useState, useCallback, useRef, useEffect } from "react";
import { Message } from "@/types";
import { MessageService } from "@/services/messageService";

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  loadMessages: (conversationId: number, token: string) => Promise<void>;
  sendMessage: (
    conversationId: number,
    content: string,
    token: string,
    onSuccess: () => Promise<void>
  ) => Promise<void>;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * useMessages Hook
 * Manages message state and operations
 * Handles message loading, sending, and auto-scroll
 */
export function useMessages(): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Auto-scroll when messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const loadMessages = useCallback(
    async (conversationId: number, token: string) => {
      try {
        setLoading(true);
        const msgs = await MessageService.fetchMessages(conversationId, token);
        setMessages(msgs);
        // Scroll to bottom immediately after loading
        setTimeout(() => scrollToBottom("auto"), 100);
      } catch (error) {
        console.error("Failed to load messages:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [scrollToBottom]
  );

  const sendMessage = useCallback(
    async (
      conversationId: number,
      content: string,
      token: string,
      onSuccess: () => Promise<void>
    ) => {
      // Create temporary user message
      const userMessage: Message = {
        id: Date.now(),
        content,
        role: "user",
        created_at: new Date().toISOString(),
      };

      // Add user message to UI immediately
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const newMessages = await MessageService.sendMessage(conversationId, content, token);
        // Replace temporary message with actual response
        setMessages((prev) => {
          const withoutTempMessage = prev.slice(0, -1);
          return [...withoutTempMessage, ...newMessages];
        });
        await onSuccess();
      } catch (error) {
        // Remove temporary message on error
        setMessages((prev) => prev.slice(0, -1));
        console.error("Failed to send message:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    messages,
    loading,
    loadMessages,
    sendMessage,
    scrollToBottom,
    messagesEndRef,
    messagesContainerRef,
  };
}
