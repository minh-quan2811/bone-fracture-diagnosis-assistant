interface SidebarToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * isVisible = true  → sidebar is open  → show < to collapse
 * isVisible = false → sidebar is closed → show > to expand
 */
export function SidebarToggleButton({ isVisible, onToggle, className = "" }: SidebarToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        w-8 h-8 flex items-center justify-center rounded-lg
        text-gray-400 hover:text-gray-600 hover:bg-gray-100
        transition-colors duration-150
        ${className}
      `}
      title={isVisible ? "Collapse sidebar" : "Expand sidebar"}
      aria-label={isVisible ? "Collapse sidebar" : "Expand sidebar"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {isVisible ? (
          /* < chevron — collapse */
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          /* > chevron — expand */
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}