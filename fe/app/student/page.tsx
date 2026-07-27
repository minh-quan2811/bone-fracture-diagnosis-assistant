"use client";
import { useEffect } from "react";
import { ConversationBase } from "@/types";

// Hooks
import { useAuth } from "@/hooks/auth";
import { useConversations, useMessages } from "@/hooks/chat";
import { useDocumentHistory } from "@/hooks/upload";
import { useSidebar, usePreventBodyScroll } from "@/hooks/shared";

// Components
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatSidebar } from "@/components/layout/ChatSidebar";
import { EmptyChatState } from "@/components/layout/EmptyChatState";
import { EmptyMessageState } from "@/components/layout/EmptyMessageState";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { FractureDetectionPanel } from "@/components/fracture/detection";
import { ResizableLayout } from "@/components/ui/ResizableLayout";
import { SidebarToggleButton } from "@/components/ui/SidebarToggleButton";

export default function StudentPage() {
  // Auth
  const { authorized, user, token, logout } = useAuth();

  // Conversations
  const {
    conversations,
    activeConversation,
    loadConversations,
    createNewConversation,
    selectConversation,
  } = useConversations();

  // Messages
  const {
    messages,
    loading,
    loadMessages,
    sendMessage,
    messagesEndRef,
    messagesContainerRef,
  } = useMessages();

  // Document History
  const {
    combinedHistory,
    loadDocumentHistory,
    handleDocumentUploadStart,
    handleDocumentUploadComplete,
    triggerRefresh,
  } = useDocumentHistory();

  // Sidebar
  const { sidebarVisible, toggleSidebar } = useSidebar();

  // Prevent body scroll
  usePreventBodyScroll();

  // Load conversations on mount
  useEffect(() => {
    if (token) {
      loadConversations(token);
    }
  }, [token, loadConversations]);

  // Load document history on mount and when refreshed
  useEffect(() => {
    if (token) {
      loadDocumentHistory(token);
    }
  }, [token, loadDocumentHistory]);

  const handleNewConversation = async () => {
    await createNewConversation(token);
  };

  const handleSelectConversation = async (conversation: ConversationBase) => {
    selectConversation({ ...conversation, messages: [] });
    await loadMessages(conversation.id, token);
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!activeConversation) return;
    try {
      await sendMessage(
        activeConversation.id,
        messageContent,
        token,
        () => loadConversations(token)
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  };

  const handleDocumentRefresh = () => {
    if (token) {
      triggerRefresh();
      loadDocumentHistory(token);
    }
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
      {/*
        Sidebar wrapper:
        - Outer div transitions its width (0 → 260px) creating a smooth slide effect.
        - overflow-hidden clips the sidebar as it collapses.
        - Inner div holds the fixed 260px sidebar so it doesn't squish during animation.
      */}
      <div
        className="flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{ width: sidebarVisible ? "260px" : "0px" }}
      >
        <div className="w-[260px] h-full">
          <ChatSidebar
            user={user}
            conversations={conversations}
            activeConversationId={activeConversation?.id || null}
            onNewChat={handleNewConversation}
            onSelectConversation={handleSelectConversation}
            onLogout={logout}
            onToggleSidebar={toggleSidebar}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ResizableLayout className="flex-1">
          <ResizableLayout.Panel defaultSize={60} minSize={40} className="flex flex-col overflow-hidden">
            {activeConversation ? (
              <>
                {/* Chat header */}
                <div className="flex-shrink-0 bg-white border-b border-gray-100 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {/* Expand toggle — only shown when sidebar is hidden */}
                    {!sidebarVisible && (
                      <SidebarToggleButton isVisible={sidebarVisible} onToggle={toggleSidebar} />
                    )}
                    <div>
                      <h2 className="font-semibold text-gray-900 text-sm leading-snug">
                        {activeConversation.title || "New Chat"}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ask me about bone fractures and injuries
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0"
                >
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
                    onDocumentUploadStart={(filename) =>
                      handleDocumentUploadStart(filename, user?.id || 0)
                    }
                    onDocumentUploadComplete={handleDocumentUploadComplete}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Top bar with expand toggle */}
                <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
                  {!sidebarVisible && (
                    <SidebarToggleButton isVisible={sidebarVisible} onToggle={toggleSidebar} />
                  )}
                </div>
                <EmptyChatState onNewChat={handleNewConversation} />
              </div>
            )}
          </ResizableLayout.Panel>

          <ResizableLayout.Splitter />

          <ResizableLayout.Panel defaultSize={40} minSize={25} className="flex flex-col overflow-hidden">
            <FractureDetectionPanel
              token={token}
              documentHistory={combinedHistory}
              onRefreshDocuments={handleDocumentRefresh}
            />
          </ResizableLayout.Panel>
        </ResizableLayout>
      </div>
    </DashboardLayout>
  );
}