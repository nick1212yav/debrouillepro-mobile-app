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

import { darkTokens, lightTokens, type ThemeTokens } from "@/theme/tokens";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  tokens: ThemeTokens;
  setTheme: (theme: Theme) => void;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DEFAULT_STORAGE_KEY = "app-theme";

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  enableSystem = true,
  storageKey = DEFAULT_STORAGE_KEY,
}: ThemeProviderProps) {
  const systemScheme = useRNColorScheme();

  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(storageKey);

        if (
          mounted &&
          storedTheme !== null &&
          (storedTheme === "light" ||
            storedTheme === "dark" ||
            storedTheme === "system")
        ) {
          setThemeState(storedTheme);
        }
      } catch {
        // Keep the configured default theme if storage is unavailable.
      } finally {
        if (mounted) {
          setHydrated(true);
        }
      }
    };

    void loadTheme();

    return () => {
      mounted = false;
    };
  }, [storageKey]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);

      void AsyncStorage.setItem(storageKey, nextTheme).catch(() => {
        // Keep the in-memory theme even if persistence fails.
      });
    },
    [storageKey],
  );

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") {
      if (!enableSystem) {
        return "light";
      }

      return systemScheme === "dark" ? "dark" : "light";
    }

    return theme;
  }, [theme, systemScheme, enableSystem]);

  const tokens = useMemo<ThemeTokens>(() => {
    return resolvedTheme === "dark" ? darkTokens : lightTokens;
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      tokens,
      setTheme,
      isSystem: theme === "system",
    }),
    [theme, resolvedTheme, tokens, setTheme],
  );

  if (!hydrated) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    return {
      theme: "light",
      resolvedTheme: "light",
      tokens: lightTokens,
      setTheme: () => undefined,
      isSystem: false,
    };
  }

  return context;
}

export default ThemeProvider;
