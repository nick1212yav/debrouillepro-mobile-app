export const navColors = {
  dark: {
    primary: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
    violet: "#6366F1",
    pink: "#EC4899",
    orange: "#F97316",
    green: "#22C55E",
    cyan: "#06B6D4",
    gray: "#9CA3AF",
    yellow: "#FBBF24",
    red: "#EF4444",
    indigo: "#6C5CE7",
    teal: "#00B894",
    blue: "#3B82F6",
  },
  light: {
    primary: "#7C3AED",
    success: "#059669",
    warning: "#D97706",
    danger: "#DC2626",
    info: "#2563EB",
    violet: "#4F46E5",
    pink: "#DB2777",
    orange: "#EA580C",
    green: "#16A34A",
    cyan: "#0891B2",
    gray: "#6B7280",
    yellow: "#D97706",
    red: "#DC2626",
    indigo: "#5B21B6",
    teal: "#0D9488",
    blue: "#2563EB",
  },
} as const;

export type ThemeName = keyof typeof navColors;

export function getNavigationColors(theme: ThemeName = "dark") {
  return navColors[theme];
}
