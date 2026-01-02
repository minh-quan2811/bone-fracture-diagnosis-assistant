import { useState, useCallback } from "react";

interface UseSidebarReturn {
  sidebarVisible: boolean;
  toggleSidebar: () => void;
}

/**
 * useSidebar Hook
 * Manages sidebar visibility state
 */
export function useSidebar(): UseSidebarReturn {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible((prev) => !prev);
  }, []);

  return {
    sidebarVisible,
    toggleSidebar,
  };
}
