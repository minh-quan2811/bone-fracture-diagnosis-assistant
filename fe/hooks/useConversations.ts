import { useState, useCallback } from "react";
import { Conversation } from "@/types";
import { ConversationService } from "@/services/conversationService";

interface UseConversationsReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loading: boolean;
  loadConversations: (token: string) => Promise<void>;
  createNewConversation: (token: string) => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  clearActiveConversation: () => void;
}

/**
 * useConversations Hook
 * Manages conversation state and operations
 */
export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async (token: string) => {
    try {
      setLoading(true);
      const convs = await ConversationService.fetchConversations(token);
      setConversations(convs);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewConversation = useCallback(
    async (token: string) => {
      try {
        const newConv = await ConversationService.createConversation("New Chat", token);
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversation(newConv);
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    },
    []
  );

  const selectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation({ ...conversation, messages: [] });
  }, []);

  const clearActiveConversation = useCallback(() => {
    setActiveConversation(null);
  }, []);

  return {
    conversations,
    activeConversation,
    loading,
    loadConversations,
    createNewConversation,
    selectConversation,
    clearActiveConversation,
  };
}
