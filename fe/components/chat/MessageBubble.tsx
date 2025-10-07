import { Message } from "@/types";
import ReactMarkdown from "react-markdown";

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
              <span className="text-indigo-600 text-xs font-bold">AI</span>
            </div>
            <span className="text-xs text-gray-500">AI Assistant</span>
          </div>
        )}
        
        <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : ""}`}>
          {isUser ? (
            <p className="text-white m-0">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-gray-900 m-0 mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-900">{children}</em>,
                ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-900">{children}</li>,
                code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-gray-800">{children}</code>,
                pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto">{children}</pre>,
                h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mt-2 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mt-2 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-bold text-gray-900 mt-2 mb-1">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        
        <p className={`text-xs mt-2 ${isUser ? "text-indigo-200" : "text-gray-500"}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}