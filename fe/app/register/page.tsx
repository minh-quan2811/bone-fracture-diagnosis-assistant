"use client";
import { RegisterHeader } from "@/components/register/RegisterHeader";
import { RegisterForm } from "@/components/register/RegisterForm";
import { useRegisterForm } from "@/hooks/register/useRegisterForm";

export default function RegisterPage() {
  const {
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    togglePasswordVisibility,
    showConfirmPassword,
    toggleConfirmPasswordVisibility,
    error,
    loading,
    handleSubmit,
  } = useRegisterForm();

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <RegisterHeader />
        <RegisterForm
          username={username}
          setUsername={setUsername}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showPassword={showPassword}
          togglePasswordVisibility={togglePasswordVisibility}
          showConfirmPassword={showConfirmPassword}
          toggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}