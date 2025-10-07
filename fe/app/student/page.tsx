"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { decodeToken } from "@/utils/jwt";
import {
  createConversation,
  getConversations,
  sendMessage,
  getMessages,
  getMe
} from "@/lib/api";

import { Message, Conversation, ConversationBase, User } from "@/types";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatSidebar } from "@/components/layout/ChatSidebar";
import { EmptyChatState } from "@/components/layout/EmptyChatState";
import { EmptyMessageState } from "@/components/layout/EmptyMessageState";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FractureDetectionPanel } from "@/components/fracture/FractureDetectionPanel";
import { ResizableLayout } from "@/components/ui/ResizableLayout";
import { SidebarToggleButton } from "@/components/ui/SidebarToggleButton";

export default function StudentPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string>("");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }

    const payload = decodeToken(storedToken);
    if (!payload) {
      router.push("/login");
      return;
    }

    const isAdmin = payload.is_admin === true || payload.is_admin === "True" || payload.is_admin === "true";
    if (isAdmin) {
      router.push("/teacher");
      return;
    }

    setToken(storedToken);
    setAuthorized(true);
    loadUserData(storedToken);
    loadConversations(storedToken);
  }, [router]);

  const loadUserData = async (authToken: string) => {
    try {
      const userData = await getMe(authToken);
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
      localStorage.removeItem("token");
      router.push("/login");
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
      // Scroll to bottom immediately after loading messages
      setTimeout(() => scrollToBottom('auto'), 100);
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

    // Immediately add the user message to the UI
    const userMessage: Message = {
      id: Date.now(), // Temporary ID
      content: messageContent,
      role: 'user',
      created_at: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setLoading(true);

    try {
      const newMessages = await sendMessage(activeConversation.id, messageContent, token);
      // Replace the temporary user message with the actual response messages
      setMessages(prevMessages => {
        const withoutTempMessage = prevMessages.slice(0, -1); // Remove temporary user message
        return [...withoutTempMessage, ...newMessages];
      });
      await loadConversations(token);
    } catch (error) {
      // Remove the temporary user message on error
      setMessages(prevMessages => prevMessages.slice(0, -1));
      console.error("Failed to send message:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
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
      {/* Sidebar - conditionally rendered with transition */}
      <div className={`${sidebarVisible ? 'w-56' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`}>
        <ChatSidebar
          user={user}
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          onNewChat={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onLogout={handleLogout}
          onToggleSidebar={handleToggleSidebar}
        />
      </div>

      {/* Main content area - adjust width based on sidebar visibility */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${sidebarVisible ? '' : 'w-full'}`}>
        <ResizableLayout className="flex-1">
          <ResizableLayout.Panel defaultSize={60} minSize={40} className="flex flex-col overflow-hidden">
            {activeConversation ? (
              <>
                {/* Chat Header with sidebar toggle only when sidebar is hidden */}
                <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {!sidebarVisible && (
                        <SidebarToggleButton 
                          isVisible={sidebarVisible}
                          onToggle={handleToggleSidebar}
                        />
                      )}
                      <div>
                        <h2 className="font-semibold text-gray-900">{activeConversation.title || "New Chat"}</h2>
                        <p className="text-sm text-gray-500">Ask me about bone fractures and injuries</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                  {messages.length === 0 ? (
                    <EmptyMessageState userRole={user?.role} />
                  ) : (
                    <>
                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                      {loading && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    loading={loading}
                    placeholder="Ask about bone fractures, treatments, or symptoms..."
                    token={token}
                    showDocumentUpload={true}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-hidden">
                {/* Empty state with sidebar toggle only when sidebar is hidden */}
                <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
                  {!sidebarVisible && (
                    <SidebarToggleButton 
                      isVisible={sidebarVisible}
                      onToggle={handleToggleSidebar}
                    />
                  )}
                </div>
                <EmptyChatState onNewChat={handleNewConversation} />
              </div>
            )}
          </ResizableLayout.Panel>

          <ResizableLayout.Splitter />

          <ResizableLayout.Panel defaultSize={40} minSize={25} className="flex flex-col overflow-hidden">
            <FractureDetectionPanel token={token} user={user} />
          </ResizableLayout.Panel>
        </ResizableLayout>
      </div>
    </DashboardLayout>
  );
}