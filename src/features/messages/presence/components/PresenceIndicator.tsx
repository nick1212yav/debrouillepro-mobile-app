// src/features/messages/presence/components/PresenceIndicator.tsx

import { StyleSheet, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { usePresence } from "../hooks/usePresence";

interface PresenceIndicatorProps {
  userId: Id<"users">;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: 8,
  md: 10,
  lg: 12,
} as const;

export function PresenceIndicator({
  userId,
  size = "md",
}: PresenceIndicatorProps) {
  const { presence } = usePresence({
    userId,
    autoStart: false,
  });

  const status = presence?.status ?? "offline";

  const isOnline = status === "online";
  const isAway = status === "away";

  const dimension = SIZES[size];

  const backgroundColor = isOnline
    ? "#10b981"
    : isAway
      ? "#fbbf24"
      : "rgba(255,255,255,0.25)";

  const accessibilityLabel = isOnline
    ? "En ligne"
    : isAway
      ? "Absent"
      : "Hors ligne";

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default PresenceIndicator;
