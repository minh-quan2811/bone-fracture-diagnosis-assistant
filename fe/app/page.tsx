"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleGoToLogin = () => {
    router.push("/login");
  };

  return (
    <div>
      <h1>Bone Fracture Helper (Frontend)</h1>
      <button 
        onClick={handleGoToLogin}
        style={{ 
          padding: "8px 16px", 
          backgroundColor: "#4f46e5", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          cursor: "pointer" 
        }}
      >
        Go to Login
      </button>
    </div>
  );
}
