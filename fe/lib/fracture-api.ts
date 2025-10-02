// APIs to manage Fracture Prediction 

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadFractureImage(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/api/fracture/upload`, {
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

export async function submitStudentAnnotations(
  predictionId: number, 
  annotations: Array<{
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
    width: number;
    height: number;
    notes?: string;
  }>, 
  token: string
) {
  const res = await fetch(`${API_BASE}/api/fracture/predictions/${predictionId}/student-annotations`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ annotations }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to save annotations" }));
    throw new Error(errorData.detail || "Failed to save annotations");
  }
  
  return res.json();
}

export async function runAiPrediction(predictionId: number, token: string) {
  const res = await fetch(`${API_BASE}/api/fracture/predictions/${predictionId}/ai-predict`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "AI prediction failed" }));
    throw new Error(errorData.detail || "AI prediction failed");
  }
  
  return res.json();
}

export async function getPredictionComparison(predictionId: number, token: string) {
  const res = await fetch(`${API_BASE}/api/fracture/predictions/${predictionId}/comparison`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to fetch comparison" }));
    throw new Error(errorData.detail || "Failed to fetch comparison");
  }
  
  return res.json();
}