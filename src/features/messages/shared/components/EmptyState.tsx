import { Pressable, View, ViewProps, PressableProps } from "react-native";
// src/features/messages/shared/components/EmptyState.tsx

import type { ReactNode } from "react";

export interface EmptyStateProps extends Omit<
  ViewProps,
  "title"
> {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: PressableProps["onClick"];
}

export function EmptyState({
  title = "Aucun élément",
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
  ...props
}: EmptyStateProps) {
  return (
    <View
      {...props}
      className={className}
      style={{ minHeight: 180, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24 }}
    >
      {icon && (
        <View
         
          style={{ marginBottom: 4 }}
        >
          {icon}
        </View>
      )}

      <View
        style={{  }}
      >
        {title}
      </View>

      {description && (
        <View
          style={{ maxWidth: 420, opacity: 0.7 }}
        >
          {description}
        </View>
      )}

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={{ marginTop: 6, borderWidth: 0, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 16 }}
        >
          {actionLabel}
        </Pressable>
      )}
    </View>
  );
}

export default EmptyState;
