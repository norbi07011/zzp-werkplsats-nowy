import { useState, useEffect } from "react";

/**
 * Hook to detect mobile screen size (< 768px)
 * Debounced for performance (150ms)
 * SSR-safe
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // SSR safety check
    if (typeof window === "undefined") {
      return;
    }

    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoint]);

  return isMobile;
}
