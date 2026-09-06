import { View, Pressable, Text, ViewStyle, TextStyle, ImageStyle } from "react-native";
/**
 * First-time hints (tooltip bubbles) for guiding new users.
 * Stored in localStorage to show only once per key.
 */
import { useState, useEffect } from "react";
import { X } from "lucide-react-native";

const STORAGE_KEY = "dbrpro_hints_dismissed";

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function dismiss(key: string) {
  const set = getDismissed();
  set.add(key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

interface HintProps {
  /** Unique identifier – shown only once per browser */
  hintKey: string;
  message: string;
  /** Delay before appearing (ms) */
  delay?: number;
  /** Arrow direction */
  arrow?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function FirstTimeHint({
  hintKey,
  message,
  delay = 800,
  arrow = "bottom",
  className = "",
}: HintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getDismissed().has(hintKey)) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [hintKey, delay]);

  const handleDismiss = () => {
    dismiss(hintKey);
    setVisible(false);
  };

  const arrowStyles: Record<string, string> = {
    top:    "bottom-full left-1/2 -translate-x-1/2 mb-1",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
    left:   "right-full top-1/2 -translate-y-1/2 mr-1",
    right:  "left-full top-1/2 -translate-y-1/2 ml-1",
  };

  const triangleStyles: Record<string, ViewStyle | TextStyle | ImageStyle> = {
    top:    { borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid rgba(139,92,246,0.9)" },
    bottom: { borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid rgba(139,92,246,0.9)" },
    left:   { borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "6px solid rgba(139,92,246,0.9)" },
    right:  { borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "6px solid rgba(139,92,246,0.9)" },
  };

  return (
    <>
      {visible && (
        <View
          key={hintKey}
          className={`absolute z-50 ${arrowStyles[arrow]} ${className}`}
          accessibilityRole="tooltip"
        >
          {/* Arrow */}
          {arrow === "bottom" && (
            <View className="flex justify-center">
              <View style={triangleStyles.bottom} />
            </View>
          )}
          {arrow === "top" && (
            <View className="flex justify-center mb-0.5">
              <View style={triangleStyles.top} />
            </View>
          )}

          {/* Bubble */}
          <View
            className="relative flex items-start gap-2 px-3 py-2 rounded-xl text-xs text-white max-w-[200px] shadow-xl"
            style={{ backgroundColor: "rgba(139,92,246,0.9)" }}
          >
            <Text className="leading-relaxed">{message}</Text>
            <Pressable
              onPress={handleDismiss}
              className="shrink-0 mt-0.5"
              accessibilityLabel="Fermer"
            >
              <X size={11} className="text-white/70" />
            </Pressable>
          </View>

          {arrow === "top" && (
            <View className="flex justify-center">
              <View style={triangleStyles.bottom} />
            </View>
          )}
        </View>
      )}
    </>
  );
}

/** Reset all hints (useful for testing) */
export function resetAllHints() {
  localStorage.removeItem(STORAGE_KEY);
}
