import { useEffect } from "react";

/**
 * usePreventBodyScroll Hook
 * Prevents body scroll when component mounts
 * Restores scroll when component unmounts
 */
export function usePreventBodyScroll(): void {
  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Cleanup: restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, []);
}
