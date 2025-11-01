import { useState } from "react";
import { Button } from "../ui/Button";
import { DocumentUpload } from "../upload/DocumentUpload";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  loading: boolean;
  placeholder?: string;
  token?: string;
  showDocumentUpload?: boolean;
  onDocumentUploadStart?: (filename: string) => void;
  onDocumentUploadComplete?: () => void;
}

export function ChatInput({ 
  onSendMessage, 
  loading, 
  placeholder = "Type your message...",
  token,
  showDocumentUpload = false,
  onDocumentUploadStart,
  onDocumentUploadComplete
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
      setInputMessage(message);
    }
  };

  const handleUploadSuccess = () => {
    onDocumentUploadComplete?.();
  };

  const handleUploadError = () => {
    onDocumentUploadComplete?.();
  };

  const handleUploadStart = (filename: string) => {
    onDocumentUploadStart?.(filename);
  };

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="p-2"> 
        <div className="flex items-center space-x-2">
          {showDocumentUpload && token && (
            <div className="flex items-center">
              <DocumentUpload
                token={token}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                onUploadStart={handleUploadStart}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-1 items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg 
                        text-gray-900 placeholder-gray-400
                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                        outline-none transition-colors bg-white"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-6 py-2.5"
            >
              {loading ? "..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}