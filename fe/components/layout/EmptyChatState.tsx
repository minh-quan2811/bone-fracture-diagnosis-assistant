import { Button } from "../ui/Button";

interface EmptyChatStateProps {
  onNewChat: () => void;
}

export function EmptyChatState({ onNewChat }: EmptyChatStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">💬</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Bone Fracture Helper
        </h2>
        <p className="text-gray-600 mb-6">
          Select an existing conversation or create a new one to start getting help with 
          bone fracture questions and medical guidance.
        </p>
        <Button onClick={onNewChat}>
          Start New Conversation
        </Button>
      </div>
    </div>
  );
}