const API_BASE = "http://localhost:8000";

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