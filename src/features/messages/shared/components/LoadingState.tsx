import { Text, View } from "react-native";

// src/features/messages/shared/components/LoadingState.tsx

import type { HTMLAttributes, ReactNode } from "react";

export interface LoadingStateProps extends HTMLAttributes<View> {
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
  className = "",
  style,
  ...props
}: LoadingStateProps) {
  const spinnerSize = SIZES[size];

  return (
    <View {...props} className={className} style={{ minHeight: 120, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, ...style }} accessibilityRole="status" accessibilityLiveRegion="polite">
      <Text accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants" style={{ width: spinnerSize, height: spinnerSize, borderRadius: 50, borderWidth: 3, borderColor: "rgba(128, 128, 128, 0.25)", borderStyle: "solid", borderTopColor: "currentColor", display: "flex" }} />

      {message && (
        <Text style={{
            fontSize: 14,
            opacity: 0.7,
          }}>
          {message}
        </Text>
      )}

      <style>
        {`
          @keyframes messages-loading-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </View>
  );
}

export default LoadingState;
