import { FracturePrediction } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type UploadResponse = FracturePrediction;

export interface DocumentUploadResponse {
  id: number;
  user_id: number;
  filename: string;
  file_type: string | null;
  status: "uploading" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export class UploadService {
  /**
   * Upload a fracture image
   */
  static async uploadFractureImage(
    file: File,
    token: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/upload/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(errorData.detail || "Upload failed");
    }

    return res.json();
  }

  /**
   * Upload a medical document
   */
  static async uploadDocument(
    file: File,
    token: string,
    collectionName: string = "medical_documents",
    indexId: string = "medical_doc_index"
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const url = new URL(`${API_BASE}/upload/document`);
    url.searchParams.append("collection_name", collectionName);
    url.searchParams.append("index_id", indexId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(errorData.detail || "Document upload failed");
    }

    return res.json();
  }
}