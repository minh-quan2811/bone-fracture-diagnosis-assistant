"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { decodeToken } from "@/utils/jwt";

export default function LoginPage() {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
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
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary-lightest)] via-white to-[var(--color-gray-50)]">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-medium)] rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 border-3 border-white rounded-md"></div>
              </div>
              <span className="text-xl font-bold text-gray-900">Bone Vision Assistant</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Login Content */}
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-medium)] rounded-2xl mb-4 shadow-lg">
            <div className="w-8 h-8 border-4 border-white rounded-lg"></div>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Bone Vision Assistant</h1>
          <p className="text-[var(--color-text-secondary)]">Sign in to continue to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[var(--color-border)] p-8">
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)]"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)]"
                required
              />
            </div>

            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-medium)] text-white font-semibold py-3 px-4 rounded-lg hover:from-[var(--color-primary-hover)] hover:to-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>


        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-4">
          Secure medical assistant platform for bone fracture diagnosis
        </p>
      </div>
      </div>
    </div>
  );
}