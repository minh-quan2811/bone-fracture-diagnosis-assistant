"use client";
import { Suspense } from "react";
import { LoginNavbar } from "@/components/login/LoginNavbar";
import { LoginHeader } from "@/components/login/LoginHeader";
import { LoginForm } from "@/components/login/LoginForm";
import { useLoginForm } from "@/hooks/login/useLoginForm";

function LoginContent() {
  const {
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
  } = useLoginForm();

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginHeader />
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          togglePasswordVisibility={togglePasswordVisibility}
          error={error}
          successMessage={successMessage}
          loading={loading}
          onSubmit={handleSubmit}
        />
        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-4">
          Secure medical assistant platform for bone fracture diagnosis
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-primary-lightest)] via-white to-[var(--color-gray-50)]">
      <LoginNavbar />
      <Suspense fallback={<div className="min-h-[calc(100vh-64px)] flex items-center justify-center">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}