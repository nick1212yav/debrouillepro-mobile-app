// src/hooks/use-mobile.ts

import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

const MOBILE_BREAKPOINT = 768;

/**
 * Vérifie si la largeur actuelle de l'écran correspond
 * à une interface mobile.
 *
 * Le breakpoint est aligné sur Tailwind `md` :
 * - mobile : largeur < 768
 * - tablette / desktop : largeur >= 768
 */
export function useIsMobile(): boolean {
  const { width } = useWindowDimensions();

  return useMemo(() => width < MOBILE_BREAKPOINT, [width]);
}

export default useIsMobile;
