export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-2xl bg-white shadow-sm border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 text-xs">🤖</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-sm text-gray-500">AI is thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}