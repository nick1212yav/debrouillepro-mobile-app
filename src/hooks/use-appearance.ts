import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Appearance } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────
export type AccentColor =
  | "violet"
  | "bleu"
  | "vert"
  | "orange"
  | "rose"
  | "dore";
export type ColorMode = "sombre" | "clair" | "systeme";
export type TextSize = "petit" | "normal" | "grand";
export type Density = "compact" | "confortable";
export type ColorBlindMode =
  | "none"
  | "deuteranopia"
  | "protanopia"
  | "tritanopia"
  | "achromatopsia";

export interface AppearancePrefs {
  accent: AccentColor;
  colorMode: ColorMode;
  textSize: TextSize;
  density: Density;
  colorBlindMode: ColorBlindMode;
  highContrast: boolean;
}

// ─── Accent palettes ──────────────────────────────────────────────────────────
export const ACCENT_PALETTES: Record<
  AccentColor,
  {
    label: string;
    emoji: string;
    hex: string;
    primary: string;
    accent: string;
    glow: string;
    gradFrom: string;
    gradTo: string;
  }
> = {
  violet: {
    label: "Violet",
    emoji: "🟣",
    hex: "#8B5CF6",
    primary: "oklch(0.65 0.25 290)",
    accent: "oklch(0.7 0.22 50)",
    glow: "rgba(139,92,246,0.4)",
    gradFrom: "#8B5CF6",
    gradTo: "#6366F1",
  },
  bleu: {
    label: "Bleu",
    emoji: "🔵",
    hex: "#3B82F6",
    primary: "oklch(0.60 0.22 260)",
    accent: "oklch(0.65 0.20 220)",
    glow: "rgba(59,130,246,0.4)",
    gradFrom: "#3B82F6",
    gradTo: "#06B6D4",
  },
  vert: {
    label: "Vert",
    emoji: "🟢",
    hex: "#10B981",
    primary: "oklch(0.65 0.20 160)",
    accent: "oklch(0.68 0.18 140)",
    glow: "rgba(16,185,129,0.4)",
    gradFrom: "#10B981",
    gradTo: "#22C55E",
  },
  orange: {
    label: "Orange",
    emoji: "🟠",
    hex: "#F97316",
    primary: "oklch(0.70 0.22  50)",
    accent: "oklch(0.72 0.20  35)",
    glow: "rgba(249,115,22,0.4)",
    gradFrom: "#F97316",
    gradTo: "#EF4444",
  },
  rose: {
    label: "Rose",
    emoji: "🩷",
    hex: "#EC4899",
    primary: "oklch(0.65 0.25 350)",
    accent: "oklch(0.68 0.22 330)",
    glow: "rgba(236,72,153,0.4)",
    gradFrom: "#EC4899",
    gradTo: "#F43F5E",
  },
  dore: {
    label: "Doré",
    emoji: "🌟",
    hex: "#F59E0B",
    primary: "oklch(0.75 0.20  80)",
    accent: "oklch(0.78 0.18  70)",
    glow: "rgba(245,158,11,0.4)",
    gradFrom: "#F59E0B",
    gradTo: "#FBBF24",
  },
};

const TEXT_SIZE_SCALE: Record<TextSize, string> = {
  petit: "14px",
  normal: "16px",
  grand: "18px",
};

const STORAGE_KEY = "debrouille_appearance_v1";

export const DEFAULT_PREFS: AppearancePrefs = {
  accent: "violet",
  colorMode: "sombre",
  textSize: "normal",
  density: "confortable",
  colorBlindMode: "none",
  highContrast: false,
};

export function loadPrefs(): AppearancePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw)
      return {
        ...DEFAULT_PREFS,
        ...(JSON.parse(raw) as Partial<AppearancePrefs>),
      };
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS;
}

function savePrefs(prefs: AppearancePrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

// Apply CSS variables and class to <html>
export function applyPrefs(prefs: AppearancePrefs) {
  const root = document.documentElement;
  const palette = ACCENT_PALETTES[prefs.accent];

  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--ring", palette.primary);
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--sidebar-primary", palette.primary);
  root.style.setProperty("--sidebar-ring", palette.primary);
  root.style.setProperty("--chart-1", palette.primary);
  root.style.setProperty("--dp-glow", palette.glow);
  root.style.setProperty("--dp-grad-from", palette.gradFrom);
  root.style.setProperty("--dp-grad-to", palette.gradTo);
  root.style.setProperty("--dp-hex", palette.hex);
  root.style.setProperty("--dp-text-base", TEXT_SIZE_SCALE[prefs.textSize]);
  root.style.fontSize = TEXT_SIZE_SCALE[prefs.textSize];
  root.style.setProperty(
    "--radius",
    prefs.density === "compact" ? "0.6rem" : "1rem",
  );

  const prefersDark = Appearance.getColorScheme().matches;
  const isDark =
    prefs.colorMode === "sombre" ||
    (prefs.colorMode === "systeme" && prefersDark);
  root.classList.toggle("dark", isDark);

  if (!isDark) {
    root.style.setProperty("--background", "oklch(0.97 0.005 264)");
    root.style.setProperty("--foreground", "oklch(0.1 0.02 264)");
    root.style.setProperty("--card", "oklch(0.93 0.01 264)");
    root.style.setProperty("--card-foreground", "oklch(0.1 0.02 264)");
    root.style.setProperty("--muted-foreground", "oklch(0.45 0.02 264)");
    root.style.setProperty("--border", "oklch(0 0 0 / 12%)");
  } else {
    root.style.setProperty("--background", "oklch(0.08 0.02 264)");
    root.style.setProperty("--foreground", "oklch(0.97 0 0)");
    root.style.setProperty("--card", "oklch(0.12 0.025 264)");
    root.style.setProperty("--card-foreground", "oklch(0.97 0 0)");
    root.style.setProperty("--muted-foreground", "oklch(0.6 0.02 264)");
    root.style.setProperty("--border", "oklch(1 0 0 / 8%)");
  }

  // High contrast override
  root.classList.toggle("high-contrast", prefs.highContrast);
  if (prefs.highContrast && isDark) {
    root.style.setProperty("--muted-foreground", "oklch(0.78 0.02 264)");
    root.style.setProperty("--border", "oklch(1 0 0 / 30%)");
  }

  // Color blind mode: remove all cb-* classes then apply current
  const cbClasses = [
    "cb-deuteranopia",
    "cb-protanopia",
    "cb-tritanopia",
    "cb-achromatopsia",
  ];
  cbClasses.forEach((c) => root.classList.remove(c));
  if (prefs.colorBlindMode && prefs.colorBlindMode !== "none") {
    root.classList.add(`cb-${prefs.colorBlindMode}`);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppearance() {
  const [prefs, setPrefs] = useState<AppearancePrefs>(loadPrefs);
  const { isAuthenticated } = useFirebaseAuth(); // ✅ remplacement

  // Convex sync
  const serverPrefs = useQuery(
    api.preferences.get,
    isAuthenticated ? {} : "skip",
  );
  const upsert = useMutation(api.preferences.upsert);

  // Track whether we've loaded from server (avoid overwriting server data with stale localStorage)
  const loadedFromServer = useRef(false);

  // On first server load, merge server preferences into local state
  useEffect(() => {
    if (!serverPrefs || loadedFromServer.current) return;
    loadedFromServer.current = true;
    const merged: AppearancePrefs = { ...prefs };
    if (serverPrefs.accentColor) merged.accent = serverPrefs.accentColor;
    if (serverPrefs.textSize) merged.textSize = serverPrefs.textSize;
    if (serverPrefs.density) merged.density = serverPrefs.density;
    if (serverPrefs.colorBlindMode)
      merged.colorBlindMode = serverPrefs.colorBlindMode;
    if (serverPrefs.highContrast !== undefined)
      merged.highContrast = serverPrefs.highContrast;
    if (serverPrefs.theme) {
      if (serverPrefs.theme === "dark") merged.colorMode = "sombre";
      else if (serverPrefs.theme === "light") merged.colorMode = "clair";
      else merged.colorMode = "systeme";
    }
    setPrefs(merged);
  }, [serverPrefs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply + save to localStorage on every change
  useEffect(() => {
    applyPrefs(prefs);
    savePrefs(prefs);
  }, [prefs]);

  const update = useCallback(
    <K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        // Sync to Convex when authenticated (fire-and-forget)
        if (isAuthenticated) {
          const convexTheme =
            next.colorMode === "sombre"
              ? "dark"
              : next.colorMode === "clair"
                ? "light"
                : "system";
          void upsert({
            accentColor: next.accent,
            textSize: next.textSize,
            density: next.density,
            theme: convexTheme,
            colorBlindMode: next.colorBlindMode,
            highContrast: next.highContrast,
          });
        }
        return next;
      });
    },
    [isAuthenticated, upsert],
  );

  const reset = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    if (isAuthenticated) {
      void upsert({
        accentColor: DEFAULT_PREFS.accent,
        textSize: DEFAULT_PREFS.textSize,
        density: DEFAULT_PREFS.density,
        theme: "dark",
        colorBlindMode: DEFAULT_PREFS.colorBlindMode,
        highContrast: DEFAULT_PREFS.highContrast,
      });
    }
  }, [isAuthenticated, upsert]);

  return { prefs, update, reset };
}

// Initialize on first load (before React mounts)
const _initPrefs = loadPrefs();
applyPrefs(_initPrefs);
