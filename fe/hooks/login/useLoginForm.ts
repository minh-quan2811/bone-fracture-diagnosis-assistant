import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/api";
import { decodeToken } from "@/utils/jwt";

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user just registered
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Registration complete! Please sign in with your credentials.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      console.log("Starting login process...");
      const data = await login(email, password);
      console.log("Login successful, received data:", data);
      
      const token = data.access_token;
      if (!token) {
        throw new Error("No access token received from server");
      }
      
      localStorage.setItem("token", token);

      const payload = decodeToken(token);
      if (!payload) throw new Error("Invalid token payload");

      const isAdmin = payload.is_admin === true || payload.is_admin === "True" || payload.is_admin === "true";
      console.log("User is admin:", isAdmin);
      
      if (isAdmin) {
        router.push("/teacher");
      } else {
        router.push("/student");
      }
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : "Login error";
      console.error("Login error details:", error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    error,
    successMessage,
    loading,
    handleSubmit,
  };
}