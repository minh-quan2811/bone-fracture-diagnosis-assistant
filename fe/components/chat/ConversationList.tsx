import { ConversationItem } from "./ConversationItem";
import { ConversationBase } from '@/types';

interface ConversationListProps {
  conversations: ConversationBase[];
  activeConversationId: number | null;
  onSelectConversation: (conversation: ConversationBase) => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-sm text-gray-400 font-medium">No conversations yet</p>
        <p className="text-xs text-gray-300 mt-1">Start a new chat to begin</p>
      </div>
    );
  }

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="py-1 space-y-0.5">
      {sortedConversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={activeConversationId === conv.id}
          onClick={() => onSelectConversation(conv)}
        />
      ))}
    </div>
  );
}