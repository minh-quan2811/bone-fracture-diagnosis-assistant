"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeToken } from "@/utils/jwt";

export default function TeacherPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const payload = decodeToken(token);
    if (!payload) {
      router.push("/login");
      return;
    }
    const isAdmin = payload.is_admin === true || payload.is_admin === "True" || payload.is_admin === "true";
    if (!isAdmin) {
      // not allowed
      router.push("/student");
      return;
    }
    setAuthorized(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (authorized === null) return <div>Checking auth...</div>;
  
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>🧑&mdash;‍🏫 Teacher UI</h1>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: "8px 16px", 
            backgroundColor: "#ef4444", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: "pointer" 
          }}
        >
          Logout
        </button>
      </div>
      <p>You&apos;re logged in as a teacher/admin.</p>
    </div>
  );
}