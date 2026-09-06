// src/features/messages/shared/components/OnlineIndicator.tsx

import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface OnlineIndicatorProps {
  online?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
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
  className,
  style,
}: OnlineIndicatorProps) {
  const indicatorSize = SIZES[size];
  const label = online ? "En ligne" : "Hors ligne";

  return (
    <View
      className={className}
      style={[styles.container, style]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.indicator,
          {
            width: indicatorSize,
            height: indicatorSize,
            minWidth: indicatorSize,
            borderRadius: indicatorSize / 2,
            backgroundColor: online ? "#22c55e" : "#9ca3af",
          },
        ]}
      />

      {showLabel ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  indicator: {
    flexShrink: 0,
  },

  label: {
    fontSize: 12,
    color: "#FFFFFF",
  },
});

export default OnlineIndicator;
