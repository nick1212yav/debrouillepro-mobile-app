// src/features/messages/shared/components/LoadingState.tsx

import type { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export interface LoadingStateProps {
  message?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const SIZES = {
  sm: "small",
  md: "small",
  lg: "large",
} as const;

export function LoadingState({
  message = "Chargement...",
  size = "md",
  className,
  style,
}: LoadingStateProps) {
  return (
    <View
      className={className}
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        typeof message === "string" ? message : "Chargement en cours"
      }
    >
      <ActivityIndicator
        size={SIZES[size]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 120,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },

  message: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
});

export default LoadingState;
