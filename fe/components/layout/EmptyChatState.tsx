import { Button } from "../ui/Button";

interface EmptyChatStateProps {
  onNewChat: () => void;
}

export function EmptyChatState({ onNewChat }: EmptyChatStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center w-full max-w-lg">
        <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-4">
          Welcome to Bone Vision Assistant
        </h2>
        <p className="text-lg text-[var(--color-text-secondary)] mb-8 leading-relaxed">
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