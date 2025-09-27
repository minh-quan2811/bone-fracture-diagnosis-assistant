import { Button } from "../ui/Button";

interface EmptyChatStateProps {
  onNewChat: () => void;
}

export function EmptyChatState({ onNewChat }: EmptyChatStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center w-full max-w-lg">
        <div className="text-8xl mb-6 text-blue-500">💬</div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
          Welcome to Bone Fracture Helper
        </h2>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          Select an existing conversation from the sidebar or click the button below to start a new chat.
          Get instant help with bone fracture questions and medical guidance.
        </p>
        <Button onClick={onNewChat} className="px-8 py-4 text-lg">
          Start New Conversation
        </Button>
      </div>
    </div>
  );
}