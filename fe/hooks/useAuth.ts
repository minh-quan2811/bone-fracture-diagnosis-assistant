import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import { AuthService } from "@/services/authService";

interface UseAuthReturn {
  authorized: boolean | null;
  user: User | null;
  token: string;
  logout: () => void;
}

/**
 * useAuth Hook
 * Manages authentication state and token validation
 * Redirects to login if unauthorized or if user is admin
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    initializeAuth();
  }, [router]);

  const initializeAuth = async () => {
    try {
      // Get stored token
      const storedToken = AuthService.getStoredToken();
      if (!storedToken) {
        router.push("/login");
        return;
      }

      // Validate token
      const role = AuthService.validateTokenAndGetRole(storedToken);
      if (!role) {
        router.push("/login");
        return;
      }

      // Check if admin - redirect to teacher page
      if (AuthService.isAdmin(storedToken)) {
        router.push("/teacher");
        return;
      }

      setToken(storedToken);
      setAuthorized(true);

      // Fetch user data
      const userData = await AuthService.fetchUser(storedToken);
      setUser(userData);
    } catch (error) {
      console.error("Auth initialization failed:", error);
      AuthService.clearToken();
      router.push("/login");
    }
  };

  const logout = useCallback(() => {
    AuthService.clearToken();
    setToken("");
    setUser(null);
    setAuthorized(false);
    router.push("/login");
  }, [router]);

  return { authorized, user, token, logout };
}
