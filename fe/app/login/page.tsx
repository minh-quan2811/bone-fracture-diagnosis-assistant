"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { decodeToken } from "@/utils/jwt";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      const token = data.access_token;
      localStorage.setItem("token", token);

      const payload = decodeToken(token);
      if (!payload) throw new Error("Invalid token payload");

      const isAdmin = payload.is_admin === true || payload.is_admin === "True" || payload.is_admin === "true";
      
      // Use router.push instead of window.location.href
      if (isAdmin) {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
    } catch (error: any) {
      setErr(error.message || "Login error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </div>

        <button type="submit" style={{ padding: "8px 12px" }} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {err && <div style={{ color: "red", marginTop: 12 }}>{err}</div>}

      <div style={{ marginTop: 16 }}>
        <strong>Seed users for quick test:</strong>
        <ul>
          <li>Teacher: teacher@example.com / secret123</li>
          <li>Student: student@example.com / secret123</li>
        </ul>
      </div>
    </div>
  );
}