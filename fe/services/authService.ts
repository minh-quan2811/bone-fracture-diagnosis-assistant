import { User } from "@/types";
import { decodeToken } from "@/utils/jwt";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Authentication Service
 * Handles auth token validation, user data fetching, and logout
 */

export class AuthService {
  /**
   * Get stored token from localStorage
   */
  static getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  /**
   * Validate token and check user role
   * Returns role or null if invalid
   */
  static validateTokenAndGetRole(token: string): string | null {
    const payload = decodeToken(token);
    if (!payload) return null;
    return payload.role || null;
  }

  /**
   * Check if user is admin
   */
  static isAdmin(token: string): boolean {
    const payload = decodeToken(token);
    if (!payload) return false;
    return payload.is_admin === true || payload.is_admin === "True" || payload.is_admin === "true";
  }

  /**
   * Fetch current user data
   */
  static async fetchUser(token: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Not authorized");
    }

    return res.json();
  }

  /**
   * Clear stored token
   */
  static clearToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }

  /**
   * Store token
   */
  static storeToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }
}
