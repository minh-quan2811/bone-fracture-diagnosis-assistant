interface BadgeProps {
  children: React.ReactNode;
  variant?: "student" | "teacher" | "assistant" | "default";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const variants = {
    student: "bg-[var(--color-primary-lightest)] text-[var(--color-primary-darkest)]",
    teacher: "bg-[var(--color-primary-light)] bg-opacity-20 text-[var(--color-primary-dark)]",
    assistant: "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]",
    default: "bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm"
  };

  return (
    <span className={`inline-block rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}