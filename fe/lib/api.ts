// APIs to manage messages and conversations

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
  try {
    const url = `${API_BASE}/auth/login`;
    console.log("Login attempt to:", url);
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log("Login response status:", res.status);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(errorData.detail || `Login failed with status ${res.status}`);
    }
    
    return res.json(); // { access_token, token_type }
  } catch (error: Error | unknown) {
    console.error("Login error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Login request timeout. Backend server may not be running.");
    }
    throw error;
  }
}