import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { ViewProps } from "react-native";
import type { ReactNode } from "react";

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

  const indicatorSize: "small" | "large" =
    spinnerSize >= 30 ? "large" : "small";

  return (
    <View
      {...props}
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={
        typeof message === "string" ? message : "Chargement en cours"
      }
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator
        size={indicatorSize}
        color="#60a5fa"
        accessibilityLabel="Chargement en cours"
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 120,
    padding: 24,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#d1d5db",
    opacity: 0.8,
    textAlign: "center",
  },
});

export default LoadingState;
