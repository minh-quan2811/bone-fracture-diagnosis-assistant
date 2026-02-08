export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-2xl bg-white shadow-md border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-[var(--color-primary-lightest)] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[var(--color-primary)] text-xs font-bold">AI</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[var(--color-primary-medium)] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[var(--color-primary-medium)] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-[var(--color-primary-medium)] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-sm text-gray-700 font-medium">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}