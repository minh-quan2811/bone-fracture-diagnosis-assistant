export function LoginHeader() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-medium)] rounded-2xl mb-4 shadow-lg">
        <div className="w-8 h-8 border-4 border-white rounded-lg"></div>
      </div>
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
        Bone Vision Assistant
      </h1>
      <p className="text-[var(--color-text-secondary)]">
        Sign in to continue to your account
      </p>
    </div>
  );
}