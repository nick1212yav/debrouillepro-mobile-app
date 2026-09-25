import { View, Text, Pressable, StyleSheet } from "react-native";
import type { ViewProps, PressableProps } from "react-native";
import type { ReactNode } from "react";

// src/features/messages/shared/components/ErrorState.tsx

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
      accessibilityRole="alert"
      style={[styles.container, style]}
    >
      <View
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
        style={styles.iconWrapper}
      >
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.actionButton}>
          <Text style={styles.actionText}>{retryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 180,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  iconWrapper: {
    marginBottom: 4,
  },
  iconText: {
    fontSize: 30,
    lineHeight: 34,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
  message: {
    maxWidth: 480,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.75,
    textAlign: "center",
    color: "#4b5563",
  },
  actionButton: {
    marginTop: 6,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: "#111827",
  },
  actionText: {
    fontWeight: "600",
    fontSize: 14,
    color: "#ffffff",
  },
});

export default ErrorState;