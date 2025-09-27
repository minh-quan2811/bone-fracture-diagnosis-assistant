import { useState } from "react";
import { Button } from "../ui/Button";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  loading: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  loading, 
  placeholder = "Type your message..." 
}: ChatInputProps) {
  const [inputMessage, setInputMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage;
    setInputMessage("");
    
    try {
      await onSendMessage(message);
    } catch (error) {
      setInputMessage(message); // Restore message on error
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="flex space-x-4">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg 
                    text-gray-900 placeholder-gray-400
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                    outline-none transition-colors bg-white"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="px-6 py-3"
        >
          {loading ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
}