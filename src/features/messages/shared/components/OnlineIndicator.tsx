// src/features/messages/shared/components/OnlineIndicator.tsx

import { StyleSheet, Text, View } from "react-native";
import type { ViewProps } from "react-native";

export interface OnlineIndicatorProps extends ViewProps {
  online?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZES = {
  sm: 8,
  md: 10,
  lg: 12,
} as const;

export function OnlineIndicator({
  online = false,
  size = "md",
  showLabel = false,
  style,
  ...props
}: OnlineIndicatorProps) {
  const indicatorSize = SIZES[size];

  const dotColor = online ? "#22C55E" : "#9CA3AF";

  const accessibilityText = online ? "En ligne" : "Hors ligne";

  return (
    <View
      {...props}
      style={[
        styles.container,
        size === "sm" && styles.containerSmall,
        size === "lg" && styles.containerLarge,
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityText}
    >
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.dot,
          {
            width: indicatorSize,
            height: indicatorSize,
            backgroundColor: dotColor,
          },
        ]}
      />

      {showLabel ? (
        <Text
          accessible={false}
          style={[
            styles.label,
            online ? styles.labelOnline : styles.labelOffline,
          ]}
        >
          {accessibilityText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  containerSmall: {
    gap: 5,
  },

  containerLarge: {
    gap: 8,
  },

  dot: {
    borderRadius: 999,
  },

  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },

  labelOnline: {
    color: "#86EFAC",
  },

  labelOffline: {
    color: "#94A3B8",
  },
});

export default OnlineIndicator;
