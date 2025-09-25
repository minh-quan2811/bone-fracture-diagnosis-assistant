"use client";
import { useEffect, useState } from "react";
import { decodeToken } from "@/utils/jwt";
import { 
  createConversation, 
  getConversations, 
  sendMessage, 
  getMessages,
  getMe 
} from "@/lib/api";

// Import types
import { Message, Conversation, ConversationBase, User } from "@/types";

// Import components
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatSidebar } from "@/components/layout/ChatSidebar";
import { ChatHeader } from "@/components/layout/ChatHeader";
import { EmptyChatState } from "@/components/layout/EmptyChatState";
import { EmptyMessageState } from "@/components/layout/EmptyMessageState";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function StudentPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      window.location.href = "/login";
      return;
    }

    const payload = decodeToken(storedToken);
    if (!payload) {
      window.location.href = "/login";
      return;
    }

    const isAdmin = payload.is_admin === true || payload.is_admin === "True" || payload.is_admin === "true";
    if (isAdmin) {
      window.location.href = "/teacher";
      return;
    }

    setToken(storedToken);
    setAuthorized(true);
    loadUserData(storedToken);
    loadConversations(storedToken);
  }, []);

  const loadUserData = async (authToken: string) => {
    try {
      const userData = await getMe(authToken);
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const loadConversations = async (authToken: string) => {
    try {
      const convs = await getConversations(authToken);
      setConversations(convs);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const msgs = await getMessages(conversationId, token);
      setMessages(msgs);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation("New Chat", token);
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleSelectConversation = async (conversation: ConversationBase) => {
  setActiveConversation({ ...conversation, messages: [] });
  await loadMessages(conversation.id);
};

  const handleSendMessage = async (messageContent: string) => {
    if (!activeConversation) return;

    setLoading(true);
    try {
      const newMessages = await sendMessage(activeConversation.id, messageContent, token);
      setMessages(prevMessages => [...prevMessages, ...newMessages]);
      
      // Update conversation list
      await loadConversations(token);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error; // Re-throw so ChatInput can handle it
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Sidebar */}
      <ChatSidebar
        user={user}
        conversations={conversations}
        activeConversationId={activeConversation?.id || null}
        onNewChat={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onLogout={handleLogout}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              title={activeConversation.title || "New Chat"}
              subtitle="Ask me about bone fractures and injuries"
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <EmptyMessageState userRole={user?.role} />
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  
                  {loading && <TypingIndicator />}
                </>
              )}
            </div>

            {/* Message Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              loading={loading}
              placeholder="Ask about bone fractures, treatments, or symptoms..."
            />
          </>
        ) : (
          <EmptyChatState onNewChat={handleNewConversation} />
        )}
      </div>
    </DashboardLayout>
  );
}