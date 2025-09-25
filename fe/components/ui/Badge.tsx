interface BadgeProps {
  children: React.ReactNode;
  variant?: "student" | "teacher" | "assistant" | "default";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const variants = {
    student: "bg-blue-100 text-blue-700",
    teacher: "bg-purple-100 text-purple-700",
    assistant: "bg-gray-100 text-gray-600",
    default: "bg-gray-100 text-gray-700"
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