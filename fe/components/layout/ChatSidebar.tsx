import { User, ConversationBase } from "@/types";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ConversationList } from "../chat/ConversationList";

interface ChatSidebarProps {
  user: User | null;
  conversations: ConversationBase[];
  activeConversationId: number | null;
  onNewChat: () => Promise<void>;
  onSelectConversation: (conversation: ConversationBase) => Promise<void>;
  onLogout: () => void;
}

export function ChatSidebar({
  user,
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onLogout
}: ChatSidebarProps) {
  const handleNewChat = async () => {
    await onNewChat();
  };

  return (
    <div className="w-80 bg-white shadow-lg flex flex-col h-full overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">🩺 Bone Helper</h1>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
        
        {user && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">Welcome back!</p>
            <p className="font-medium text-gray-900">{user.username}</p>
            <Badge 
              variant={user.role === "student" ? "student" : "teacher"}
              size="sm"
            >
              {user.role === "student" ? "🎓 Student" : "👨‍🏫 Teacher"}
            </Badge>
          </div>
        )}
        
        <Button onClick={handleNewChat} className="w-full">
          + New Chat
        </Button>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={onSelectConversation}
        />
      </div>
    </div>
  );
}