// src/features/messages/shared/components/ErrorState.tsx

import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PressableProps, ViewProps } from "react-native";

export interface ErrorStateProps extends Omit<ViewProps, "title"> {
  title?: ReactNode;
  message?: ReactNode;
  icon?: ReactNode;
  retryLabel?: string;
  onRetry?: PressableProps["onPress"];
}

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données.",
  icon = "⚠️",
  retryLabel = "Réessayer",
  onRetry,
  style,
  ...props
}: ErrorStateProps) {
  return (
    <View
      {...props}
      style={[styles.container, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {icon ? (
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.iconWrapper}
        >
          <Text accessible={false} style={styles.iconText}>
            {icon}
          </Text>
        </View>
      ) : null}

      {title ? <Text style={styles.title}>{title}</Text> : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          accessibilityHint="Réessayer le chargement"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={styles.actionText}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 180,
    padding: 24,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  iconWrapper: {
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: 30,
    lineHeight: 34,
    textAlign: "center",
    color: "#FCD34D",
  },

  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
    color: "#F8FAFC",
  },

  message: {
    width: "100%",
    maxWidth: 480,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    textAlign: "center",
    color: "#94A3B8",
  },

  actionButton: {
    minHeight: 42,
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },

  actionButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  actionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default ErrorState;
