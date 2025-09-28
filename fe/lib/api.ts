// File: fe/lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Auth APIs
export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, is_admin: false }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(errorData.detail || "Registration failed");
  }
  
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(errorData.detail || "Login failed");
  }
  
  return res.json(); // { access_token, token_type }
}

export async function getMe(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Not authorized");
  }
  
  return res.json();
}

// Student Chat APIs
export async function getConversations(token: string) {
  const res = await fetch(`${API_BASE}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch conversations");
  }
  
  return res.json();
}

export async function createConversation(title: string, token: string) {
  const res = await fetch(`${API_BASE}/chat/conversations`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ title }),
  });
  
  if (!res.ok) {
    throw new Error("Failed to create conversation");
  }
  
  return res.json();
}

export async function getMessages(conversationId: number, token: string) {
  const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }
  
  return res.json();
}

export async function sendMessage(conversationId: number, content: string, token: string) {
  const userInfo = await getMe(token);
  const role = userInfo.role;

  const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ 
      role: role,
      content
    }),
  });
  
  if (!res.ok) {
    throw new Error("Failed to send message");
  }
  
  return res.json();
}

// Updated Fracture Prediction APIs
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

export async function predictFracture(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/api/fracture/predict`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Prediction failed" }));
    throw new Error(errorData.detail || "Prediction failed");
  }
  
  return res.json();
}

export async function testPredictFracture(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/api/fracture/test-prediction`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Test prediction failed" }));
    throw new Error(errorData.detail || "Test prediction failed");
  }
  
  return res.json();
}

export async function getFracturePredictions(token: string, params?: {
  skip?: number;
  limit?: number;
  has_student_predictions?: boolean;
  has_ai_predictions?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
  if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
  if (params?.has_student_predictions !== undefined) searchParams.append('has_student_predictions', params.has_student_predictions.toString());
  if (params?.has_ai_predictions !== undefined) searchParams.append('has_ai_predictions', params.has_ai_predictions.toString());
  
  const url = `${API_BASE}/api/fracture/predictions${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch fracture predictions");
  }
  
  return res.json();
}

export async function getFractureStats(token: string) {
  const res = await fetch(`${API_BASE}/api/fracture/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    throw new Error("Failed to fetch fracture statistics");
  }
  
  return res.json();
}