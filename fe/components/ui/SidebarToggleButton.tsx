interface SidebarToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarToggleButton({ isVisible, onToggle, className = "" }: SidebarToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
      title={isVisible ? "Hide sidebar" : "Show sidebar"}
      aria-label={isVisible ? "Hide sidebar" : "Show sidebar"}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 text-gray-600" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        {isVisible ? (
          // X icon when sidebar is visible (to close it)
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        ) : (
          // Hamburger menu when sidebar is hidden (to open it)
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );
}