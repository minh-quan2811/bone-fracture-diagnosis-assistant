import { ConversationBase } from '@/types';

interface ConversationItemProps {
  conversation: ConversationBase;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group
        ${isActive
          ? "bg-[#EDF7F1] border border-[#A8D5BA]"
          : "bg-transparent hover:bg-gray-50 border border-transparent"
        }
      `}
    >
      <p
        className={`text-sm font-medium truncate leading-snug ${
          isActive ? "text-[#1B5E3A]" : "text-gray-800 group-hover:text-gray-900"
        }`}
      >
        {conversation.title || "New Chat"}
      </p>
      <p
        className={`text-xs mt-0.5 leading-tight ${
          isActive ? "text-[#2E7D5C]" : "text-gray-400"
        }`}
      >
        {formatDate(conversation.created_at)}
      </p>
    </button>
  );
}