import { useState, useEffect } from "react";

/**
 * Hook do wykrywania rozmiaru ekranu mobilnego
 * Breakpoint: 768px (Tailwind md:)
 * Debounced: 150ms dla wydajności
 * SSR-safe
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

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
