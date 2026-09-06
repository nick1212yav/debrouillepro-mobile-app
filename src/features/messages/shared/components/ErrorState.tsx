import { Pressable, View, ViewProps, PressableProps } from "react-native";
// src/features/messages/shared/components/ErrorState.tsx

import type { ReactNode } from "react";

export interface ErrorStateProps extends Omit<
  ViewProps,
  "title"
> {
  title?: ReactNode;
  message?: ReactNode;
  icon?: ReactNode;
  retryLabel?: string;
  onRetry?: PressableProps["onClick"];
}

export function ErrorState({
  title = "Une erreur est survenue",
  message = "Impossible de charger les données.",
  icon = "⚠️",
  retryLabel = "Réessayer",
  onRetry,
  className = "",
  ...props
}: ErrorStateProps) {
  return (
    <View
      {...props}
      className={className}
      accessibilityRole="alert"
      style={{ minHeight: 180, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24 }}
    >
      <View
       
        style={{ marginBottom: 4 }}
      >
        {icon}
      </View>

      <View
        style={{  }}
      >
        {title}
      </View>

      {message && (
        <View
          style={{ maxWidth: 480, opacity: 0.75 }}
        >
          {message}
        </View>
      )}

      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={{ marginTop: 6, borderWidth: 0, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 16 }}
        >
          {retryLabel}
        </Pressable>
      )}
    </View>
  );
}

export default ErrorState;
