interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: "text" | "email" | "password";
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function Input({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  type = "text", 
  required = false,
  disabled = false,
  error,
  className = ""
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)]">
          {label} {required && <span className="text-[var(--color-error)]">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors ${
          error ? "border-[var(--color-error)]" : "border-[var(--color-border)]"
        } ${className}`}
      />
      {error && (
        <p className="text-sm text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}