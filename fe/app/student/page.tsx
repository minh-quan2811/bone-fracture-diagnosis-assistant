// frontend/app/student/page.tsx
"use client";
import { useEffect, useState } from "react";
import { decodeToken } from "@/utils/jwt";

export default function StudentPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const payload = decodeToken(token);
    if (!payload) {
      window.location.href = "/login";
      return;
    }
    const isAdmin = payload.is_admin === true || payload.is_admin === "True" || payload.is_admin === "true";
    if (isAdmin) {
      // not allowed
      window.location.href = "/teacher";
      return;
    }
    setAuthorized(true);
  }, []);

  if (authorized === null) return <div>Checking auth...</div>;
  return (
    <div>
      <h1>🎓 Student UI</h1>
      <p>You're logged in as a student.</p>
    </div>
  );
}
