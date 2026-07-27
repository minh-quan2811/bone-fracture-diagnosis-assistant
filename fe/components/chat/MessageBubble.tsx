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
    <div className="flex flex-col">
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-2xl rounded-lg p-4 ${isUser ? "bg-[var(--color-primary)] text-white" : "bg-white shadow-sm border border-gray-200"}`}>
          <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : ""}`}>
            {isUser ? (
              <p className="text-white m-0 whitespace-pre-wrap break-words">{message.content}</p>
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
        </div>
      </div>

      {isUser && (
        <div className="flex justify-end mt-1 mr-1">
          <span style={{ fontSize: "9px", color: "var(--color-gray-600)" }} className="leading-none select-none">{formatTime(message.created_at)}</span>
        </div>
      )}
    </div>
  );
}