import { User, ConversationBase } from "@/types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ConversationList } from "../chat/ConversationList";
import { SidebarToggleButton } from "../ui/SidebarToggleButton";

interface ChatSidebarProps {
  user: User | null;
  conversations: ConversationBase[];
  activeConversationId: number | null;
  onNewChat: () => Promise<void>;
  onSelectConversation: (conversation: ConversationBase) => Promise<void>;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function ChatSidebar({
  user,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onLogout,
  onToggleSidebar
}: ChatSidebarProps) {
  const handleNewChat = async () => {
    await onNewChat();
  };

  return (
    <div className="w-56 bg-white shadow-lg flex flex-col h-full overflow-hidden">
      {/* Header - Fixed at top with close button */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-gray-900">Bone Helper</h1>
          <SidebarToggleButton 
            isVisible={true}
            onToggle={onToggleSidebar}
            className="hover:bg-gray-100"
          />
        </div>
        
        {user && (
          <div className="mb-3">
            <p className="text-sm text-gray-600">Welcome back!</p>
            <p className="font-medium text-gray-900 text-sm">{user.username}</p>
            <Badge 
              variant={user.role === "student" ? "student" : "teacher"}
              size="sm"
            >
              {user.role === "student" ? "Student" : "Teacher"}
            </Badge>
          </div>
        )}
        
        <Button onClick={handleNewChat} className="w-full text-sm">
          + New Chat
        </Button>
      </div>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
        />
      </div>

      {/* Logout at bottom */}
      <div className="p-3 border-t border-gray-200 flex justify-center">
        <button
          onClick={onLogout}
          className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}