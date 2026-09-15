// src/components/providers/theme.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types (compat next-themes) ────────────────────────────────────────────
export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeProviderProps {
  children: ReactNode;
  /** Thème initial (compat next-themes). */
  defaultTheme?: Theme;
  /** Sur true, `system` suit le thème du système. */
  enableSystem?: boolean;
  /** Clé de stockage AsyncStorage (par défaut "app-theme"). */
  storageKey?: string;
}

interface ThemeContextValue {
  /** Préférence utilisateur : "light" | "dark" | "system". */
  theme: Theme;
  /** Thème réellement appliqué : "light" | "dark". */
  resolvedTheme: ResolvedTheme;
  /** Change la préférence. */
  setTheme: (theme: Theme) => void;
  /** true si l'utilisateur a choisi "system". */
  isSystem: boolean;
}

// ── Contexte ──────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DEFAULT_STORAGE_KEY = "app-theme";

// ── Provider ──────────────────────────────────────────────────────────────
export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  storageKey = DEFAULT_STORAGE_KEY,
}: ThemeProviderProps) {
  const systemScheme = useRNColorScheme(); // "light" | "dark" | null
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [hydrated, setHydrated] = useState(false);

  // Charge la préférence sauvegardée au premier rendu.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = (await AsyncStorage.getItem(storageKey)) as Theme | null;
        if (!cancelled && stored) {
          setThemeState(stored);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // setTheme : met à jour l'état + persiste.
  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      AsyncStorage.setItem(storageKey, next).catch(() => {
        // ignore
      });
    },
    [storageKey],
  );

  // Résout le thème réel.
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") {
      if (!enableSystem) return "light";
      return systemScheme === "dark" ? "dark" : "light";
    }
    return theme;
  }, [theme, systemScheme, enableSystem]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      isSystem: theme === "system",
    }),
    [theme, resolvedTheme, setTheme],
  );

  // ⚠️ Évite un flash de thème avant la lecture AsyncStorage.
  //    Passe `null` ou un placeholder si tu veux gérer un splash.
  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback safe : renvoie un thème par défaut au lieu de crasher
    // (utile si un composant est rendu hors du Provider pendant la transition).
    return {
      theme: "system",
      resolvedTheme: "light",
      setTheme: () => undefined,
      isSystem: true,
    };
  }
  return ctx;
}

export default ThemeProvider;
