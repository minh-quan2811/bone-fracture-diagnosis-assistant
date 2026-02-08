interface SidebarToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarToggleButton({ isVisible, onToggle, className = "" }: SidebarToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 hover:bg-[var(--color-surface)] rounded-lg transition-colors ${className}`}
      title={isVisible ? "Hide sidebar" : "Show sidebar"}
      aria-label={isVisible ? "Hide sidebar" : "Show sidebar"}
    >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-[var(--color-text-secondary)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {isVisible ? (
        // Collapse sidebar
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-7-7 7-7"
        />
      ) : (
        // Expand sidebar
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5l7 7-7 7"
        />
      )}
    </svg>
    </button>
  );
}