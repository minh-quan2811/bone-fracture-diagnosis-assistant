import { DocumentUpload } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Document Service
 * Handles document upload history and related operations
 */

export class DocumentService {
  /**
   * Fetch document upload history for the user
   */
  static async fetchDocumentHistory(token: string): Promise<DocumentUpload[]> {
    const res = await fetch(`${API_BASE}/upload/documents/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch document history");
    }

    return res.json();
  }
}
