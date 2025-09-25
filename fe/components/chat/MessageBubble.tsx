import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isUser = message.role !== "assistant";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-2xl rounded-lg p-4 ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-white shadow-sm border border-gray-200"
        }`}
      >
        {message.role === "assistant" && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 text-xs">🤖</span>
            </div>
            <span className="text-xs text-gray-500">AI Assistant</span>
          </div>
        )}
        
        <div className="prose prose-sm max-w-none">
          <p className={isUser ? "text-white" : "text-gray-900"}>
            {message.content}
          </p>
        </div>
        
        <p className={`text-xs mt-2 ${isUser ? "text-indigo-200" : "text-gray-500"}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}