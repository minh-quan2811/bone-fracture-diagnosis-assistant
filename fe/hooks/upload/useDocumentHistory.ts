import { useState, useCallback } from "react";
import { DocumentUpload } from "@/types";
import { DocumentService } from "@/services/documentService";

interface UseDocumentHistoryReturn {
  documentHistory: DocumentUpload[];
  uploadingDocs: Map<string, DocumentUpload>;
  combinedHistory: DocumentUpload[];
  loadDocumentHistory: (token: string) => Promise<void>;
  handleDocumentUploadStart: (filename: string, userId: number) => void;
  handleDocumentUploadComplete: () => void;
  triggerRefresh: () => void;
}

/**
 * useDocumentHistory Hook
 * Manages document upload history and uploading documents state
 */
export function useDocumentHistory(): UseDocumentHistoryReturn {
  const [documentHistory, setDocumentHistory] = useState<DocumentUpload[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState<Map<string, DocumentUpload>>(new Map());
  const [shouldRefresh, setShouldRefresh] = useState(0);

  const loadDocumentHistory = useCallback(async (token: string) => {
    try {
      const docs = await DocumentService.fetchDocumentHistory(token);
      setDocumentHistory(docs);
    } catch (error) {
      console.error("Failed to load document history:", error);
    }
  }, []);

  const handleDocumentUploadStart = useCallback((filename: string, userId: number) => {
    const tempDoc: DocumentUpload = {
      id: Date.now(),
      user_id: userId,
      filename,
      file_type: null,
      status: "uploading",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUploadingDocs((prev) => new Map(prev).set(filename, tempDoc));
  }, []);

  const handleDocumentUploadComplete = useCallback(() => {
    setUploadingDocs(new Map());
    setShouldRefresh((prev) => prev + 1);
  }, []);

  const triggerRefresh = useCallback(() => {
    setShouldRefresh((prev) => prev + 1);
  }, []);

  // Combine uploading and historical documents
  const combinedHistory = [
    ...Array.from(uploadingDocs.values()),
    ...documentHistory,
  ];

  return {
    documentHistory,
    uploadingDocs,
    combinedHistory,
    loadDocumentHistory,
    handleDocumentUploadStart,
    handleDocumentUploadComplete,
    triggerRefresh,
  };
}
