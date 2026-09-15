/**
 * First-time hints (tooltip bubbles) for guiding new users (React Native).
 * Persisted via AsyncStorage (fallback : in-memory) to show only once per key.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { X } from "lucide-react-native";

const STORAGE_KEY = "dbrpro_hints_dismissed";

// ---------------------------------------------------------------------------
// Storage (AsyncStorage si dispo, sinon in-memory)
// ---------------------------------------------------------------------------

let AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch {
  AsyncStorage = null;
}

// Fallback mémoire (perdu au redémarrage de l'app, mais sûr)
const memoryStorage = new Map<string, string>();

async function readRaw(key: string): Promise<string | null> {
  if (AsyncStorage) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      /* ignore */
    }
  }
  return memoryStorage.get(key) ?? null;
}

async function writeRaw(key: string, value: string): Promise<void> {
  if (AsyncStorage) {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch {
      /* ignore */
    }
  }
  memoryStorage.set(key, value);
}

async function removeRaw(key: string): Promise<void> {
  if (AsyncStorage) {
    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch {
      /* ignore */
    }
  }
  memoryStorage.delete(key);
}

async function getDismissed(): Promise<Set<string>> {
  try {
    const raw = await readRaw(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

async function dismiss(key: string): Promise<void> {
  const set = await getDismissed();
  set.add(key);
  await writeRaw(STORAGE_KEY, JSON.stringify([...set]));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HintProps {
  hintKey: string;
  message: string;
  delay?: number;
  arrow?: "top" | "bottom" | "left" | "right";
  style?: ViewStyle;
}

type ArrowDirection = "top" | "bottom" | "left" | "right";

// ---------------------------------------------------------------------------
// Arrow position styles (RN)
// ---------------------------------------------------------------------------

const ARROW_CONTAINER_STYLE: Record<ArrowDirection, ViewStyle> = {
  top: { position: "absolute", bottom: "100%", alignSelf: "center" },
  bottom: { position: "absolute", top: "100%", alignSelf: "center" },
  left: { position: "absolute", right: "100%", alignSelf: "center" },
  right: { position: "absolute", left: "100%", alignSelf: "center" },
};

const TRIANGLE_COLOR = "rgba(139,92,246,0.9)";

const TRIANGLE_STYLE: Record<ArrowDirection, ViewStyle> = {
  // Pointe vers le bas → triangle visible sous la bulle
  top: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: TRIANGLE_COLOR,
  },
  // Pointe vers le haut → triangle visible au-dessus de la bulle
  bottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: TRIANGLE_COLOR,
  },
  left: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: TRIANGLE_COLOR,
  },
  right: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: TRIANGLE_COLOR,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FirstTimeHint({
  hintKey,
  message,
  delay = 800,
  arrow = "bottom",
  style,
}: HintProps) {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;
  const translateY = useRef(
    new Animated.Value(arrow === "top" ? 8 : -8),
  ).current;

  // Vérifie si le hint a déjà été dismissed
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const dismissed = await getDismissed();
      if (cancelled || dismissed.has(hintKey)) return;

      const t = setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, delay);

      return () => clearTimeout(t);
    })();

    return () => {
      cancelled = true;
    };
  }, [hintKey, delay]);

  // Animation d'apparition
  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 400,
        damping: 28,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, scale, translateY]);

  const handleDismiss = useCallback(() => {
    void dismiss(hintKey);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [hintKey, opacity, scale]);

  if (!visible) {
    return null;
  }

  const isTop = arrow === "top";
  const isBottom = arrow === "bottom";

  return (
    <Animated.View
      accessibilityRole="text"
      style={[
        styles.container,
        ARROW_CONTAINER_STYLE[arrow],
        style,
        {
          opacity,
          transform: [{ scale }, { translateY }],
        },
      ]}
    >
      {/* Arrow above (pour arrow="bottom" on veut la flèche au-dessus de la bulle) */}
      {isBottom && (
        <View style={styles.arrowRow}>
          <View style={TRIANGLE_STYLE.bottom} />
        </View>
      )}
      {isTop && (
        <View style={styles.arrowRow}>
          <View style={TRIANGLE_STYLE.top} />
        </View>
      )}

      {/* Bubble */}
      <View style={styles.bubble}>
        <Text style={styles.message}>{message}</Text>
        <Pressable
          onPress={handleDismiss}
          hitSlop={6}
          accessibilityLabel="Fermer"
          style={styles.closeButton}
        >
          <X size={11} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      {/* Arrow below (pour arrow="top", flèche sous la bulle) */}
      {isTop && (
        <View style={styles.arrowRow}>
          <View style={TRIANGLE_STYLE.bottom} />
        </View>
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    zIndex: 50,
    maxWidth: 220,
  },
  arrowRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.9)",
    maxWidth: 200,
    // Ombre iOS + elevation Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: 2,
    flexShrink: 0,
  },
});

// ---------------------------------------------------------------------------
// Reset helper
// ---------------------------------------------------------------------------

/** Reset all hints (useful for testing) */
export async function resetAllHints(): Promise<void> {
  await removeRaw(STORAGE_KEY);
}
