// frontend/app/teacher/page.tsx
"use client";
import { useEffect, useState } from "react";
import { decodeToken } from "@/utils/jwt";

export default function TeacherPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const payload = decodeToken(token);
    if (!payload) {
      window.location.href = "/login";
      return;
    }
    const isAdmin = payload.is_admin === true || payload.is_admin === "True" || payload.is_admin === "true";
    if (!isAdmin) {
      // not allowed
      window.location.href = "/student";
      return;
    }
    setAuthorized(true);
  }, []);

  if (authorized === null) return <div>Checking auth...</div>;
  return (
    <div>
      <h1>🧑‍🏫 Teacher UI</h1>
      <p>You're logged in as a teacher/admin.</p>
    </div>
  );
}
