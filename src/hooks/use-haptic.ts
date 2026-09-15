/**
 * useHaptic — triggers device vibration for tactile feedback on mobile.
 * Silently no-ops on devices that don't support the Vibration API.
 */

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "warning";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light:   10,
  medium:  25,
  heavy:   50,
  success: [15, 60, 15],
  error:   [40, 30, 40, 30, 80],
  warning: [20, 40, 20],
};

export function useHaptic() {
  const trigger = (pattern: HapticPattern = "light") => {
    if (!("vibrate" in navigator)) return;
    try {
      navigator.vibrate(PATTERNS[pattern]);
    } catch {
      // ignore — vibration not allowed in this context
    }
  };

  return { trigger };
}
