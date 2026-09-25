import { View, Text, StyleSheet } from "react-native";
import type { ViewProps } from "react-native";

// src/features/messages/shared/components/OnlineIndicator.tsx

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
  const dotColor = online ? "#22c55e" : "#9ca3af";

  return (
    <View
      {...props}
      style={[styles.container, style]}
      accessibilityLabel={online ? "En ligne" : "Hors ligne"}
    >
      <View
        accessibilityElementsHidden={true}
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
      {showLabel && (
        <Text style={styles.label}>
          {online ? "En ligne" : "Hors ligne"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    borderRadius: 999,
  },
  label: {
    fontSize: 13,
    color: "#4b5563",
  },
});

export default OnlineIndicator;