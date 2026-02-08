interface EmptyMessageStateProps {
  userRole?: string;
}

export function EmptyMessageState({ userRole }: EmptyMessageStateProps) {
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
        Start a conversation
      </h3>
      <p className="text-[var(--color-text-secondary)] max-w-md mx-auto">
        {userRole === "teacher" 
          ? "Ask me about bone fractures, treatments, or help students with their questions."
          : "Ask me about bone fractures, treatments, symptoms, or any related medical questions."
        }
      </p>
    </div>
  );
}