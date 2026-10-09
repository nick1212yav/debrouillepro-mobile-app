// src/features/messages/shared/components/EmptyState.tsx

import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PressableProps, ViewProps } from "react-native";

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
  const hasAction = Boolean(actionLabel) && Boolean(onAction);

  return (
    <View {...props} style={[styles.container, style]}>
      {icon && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.iconWrapper}
        >
          <Text accessible={false} style={styles.iconText}>
            {icon}
          </Text>
        </View>
      )}

      {title && <Text style={styles.title}>{title}</Text>}

      {description && <Text style={styles.description}>{description}</Text>}

      {hasAction && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            typeof actionLabel === "string" ? actionLabel : undefined
          }
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
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
    fontSize: 32,
    lineHeight: 34,
    textAlign: "center",
    color: "#CBD5E1",
  },

  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
    color: "#F8FAFC",
  },

  description: {
    width: "100%",
    maxWidth: 420,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    textAlign: "center",
    color: "#94A3B8",
  },

  actionButton: {
    minHeight: 40,
    marginTop: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },

  actionButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  actionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default EmptyState;
