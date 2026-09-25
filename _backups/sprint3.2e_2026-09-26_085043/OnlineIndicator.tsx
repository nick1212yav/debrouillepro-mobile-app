import { Text, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";

// src/features/messages/shared/components/OnlineIndicator.tsx

import type { HTMLAttributes } from "react";

export interface OnlineIndicatorProps extends HTMLAttributes<Text> {
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
  className = "",
  style,
  ...props
}: OnlineIndicatorProps) {
  const indicatorSize = SIZES[size];

  const indicatorStyle: ViewStyle | TextStyle | ImageStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    ...style,
  };

  return (
    <Text {...props} className={className} style={indicatorStyle} accessibilityLabel={online ? "En ligne" : "Hors ligne"}>
      <Text accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" style={{ width: indicatorSize, height: indicatorSize, minWidth: indicatorSize, borderRadius: 50, backgroundColor: online ? "#22c55e" : "#9ca3af", display: "inline-block" }} />

      {showLabel && <Text>{online ? "En ligne" : "Hors ligne"}</Text>}
    </Text>
  );
}

export default OnlineIndicator;
