interface EmptyMessageStateProps {
  userRole?: string;
}

export function EmptyMessageState({ userRole }: EmptyMessageStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🤖</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Start a conversation
      </h3>
      <p className="text-gray-600 max-w-md mx-auto">
        {userRole === "teacher" 
          ? "Ask me about bone fractures, treatments, or help students with their questions."
          : "Ask me about bone fractures, treatments, symptoms, or any related medical questions."
        }
      </p>
    </div>
  );
}