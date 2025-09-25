import { ConversationItem } from "./ConversationItem";

interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({ 
  conversations, 
  activeConversationId, 
  onSelectConversation 
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No conversations yet.</p>
        <p className="text-sm mt-1">Start a new chat!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {conversations.map((conv) => (
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