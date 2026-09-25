import { ActivityIndicator, Text, View, StyleSheet } from "react-native";
import type { ViewProps } from "react-native";
import type { ReactNode } from "react";

// src/features/messages/shared/components/LoadingState.tsx

export interface LoadingStateProps extends ViewProps {
  message?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: 18,
  md: 28,
  lg: 40,
} as const;

export function LoadingState({
  message = "Chargement...",
  size = "md",
  style,
  ...props
}: LoadingStateProps) {
  const spinnerSize = SIZES[size];
  const indicatorSize = spinnerSize >= 30 ? "large" : "small";

  return (
    <View
      {...props}
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator size={indicatorSize} color="#6b7280" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 120,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  message: {
    fontSize: 14,
    opacity: 0.7,
    color: "#4b5563",
  },
});

export default LoadingState;