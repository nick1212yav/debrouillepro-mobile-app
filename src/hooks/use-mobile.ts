import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

const MOBILE_BREAKPOINT = 768;

/**
 * Checks if the screen is mobile (equivalent to md in tailwind)
 * @returns Whether the screen is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(Dimensions.get("window").width < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(Dimensions.get("window").width < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
