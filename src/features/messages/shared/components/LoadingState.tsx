// src/features/messages/shared/components/LoadingState.tsx

import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { ViewProps } from "react-native";

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
      style={[
        styles.container,
        size === "sm" && styles.containerSmall,
        size === "lg" && styles.containerLarge,
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={
        typeof message === "string" ? message : "Chargement en cours"
      }
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator
        size={indicatorSize}
        color="#60A5FA"
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

  containerSmall: {
    minHeight: 80,
    padding: 16,
    gap: 8,
  },

  containerLarge: {
    minHeight: 160,
    padding: 28,
    gap: 14,
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    textAlign: "center",
    color: "#CBD5E1",
  },
});

export default LoadingState;
