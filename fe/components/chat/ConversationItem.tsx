interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        isActive
          ? "bg-indigo-50 border-indigo-200 border"
          : "hover:bg-gray-50"
      }`}
    >
      <p className="font-medium text-gray-900 truncate">
        {conversation.title || "New Chat"}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {formatDate(conversation.created_at)}
      </p>
    </button>
  );
}
