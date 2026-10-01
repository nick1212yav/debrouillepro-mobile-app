// src/theme/tokens.ts

export type AppTheme = "light" | "dark";

export interface ThemeTokens {
  background: string;
  backgroundElevated: string;

  surface: string;
  surfaceMuted: string;
  surfaceStrong: string;

  border: string;
  borderStrong: string;
  borderSoft: string;

  foreground: string;
  foregroundSecondary: string;
  foregroundMuted: string;
  foregroundFaint: string;

  primary: string;
  primaryForeground: string;
  primarySoft: string;

  success: string;
  warning: string;
  danger: string;

  input: string;
  inputBorder: string;

  overlay: string;
}

export const lightTokens: ThemeTokens = {
  background: "#F8FAFC",
  backgroundElevated: "#FFFFFF",

  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  surfaceStrong: "#E2E8F0",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  borderSoft: "#F1F5F9",

  foreground: "#0F172A",
  foregroundSecondary: "#334155",
  foregroundMuted: "#64748B",
  foregroundFaint: "#94A3B8",

  primary: "#2563EB",
  primaryForeground: "#FFFFFF",
  primarySoft: "#EFF6FF",

  success: "#16A34A",
  warning: "#F59E0B",
  danger: "#EF4444",

  input: "#FFFFFF",
  inputBorder: "#CBD5E1",

  overlay: "rgba(15, 23, 42, 0.45)",
};

export const darkTokens: ThemeTokens = {
  background: "#050509",
  backgroundElevated: "#0A0A10",

  surface: "#11131C",
  surfaceMuted: "#171923",
  surfaceStrong: "#202330",

  border: "rgba(255, 255, 255, 0.09)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  borderSoft: "rgba(255, 255, 255, 0.06)",

  foreground: "#FFFFFF",
  foregroundSecondary: "rgba(255, 255, 255, 0.82)",
  foregroundMuted: "rgba(255, 255, 255, 0.58)",
  foregroundFaint: "rgba(255, 255, 255, 0.36)",

  primary: "#8B5CF6",
  primaryForeground: "#FFFFFF",
  primarySoft: "rgba(139, 92, 246, 0.16)",

  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",

  input: "#11131C",
  inputBorder: "rgba(255, 255, 255, 0.12)",

  overlay: "rgba(0, 0, 0, 0.60)",
};

export const themeTokens: Record<AppTheme, ThemeTokens> = {
  light: lightTokens,
  dark: darkTokens,
};