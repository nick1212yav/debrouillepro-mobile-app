import { View, Text, Pressable, StyleSheet } from "react-native";
import type { ViewProps, PressableProps } from "react-native";
import type { ReactNode } from "react";

// src/features/messages/shared/components/EmptyState.tsx

export interface EmptyStateProps extends Omit<ViewProps, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: PressableProps["onPress"];
}

export function EmptyState({
  title = "Aucun élément",
  description,
  icon,
  actionLabel,
  onAction,
  style,
  ...props
}: EmptyStateProps) {
  return (
    <View {...props} style={[styles.container, style]}>
      {icon && (
        <View
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
          style={styles.iconWrapper}
        >
          <Text style={styles.iconText}>{icon}</Text>
        </View>
      )}
      {title && <Text style={styles.title}>{title}</Text>}
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionLabel}</Text>
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
    fontSize: 32,
    lineHeight: 34,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
  description: {
    maxWidth: 420,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.7,
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

export default EmptyState;