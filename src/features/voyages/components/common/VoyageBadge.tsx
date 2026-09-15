import { View, Text } from "react-native";

// src/features/voyages/components/common/VoyageBadge.tsx
import type { ReactNode } from "react";

interface VoyageBadgeProps {
  children?: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
}

// Variantes : sépare les classes de CONTENEUR et de TEXTE
const CONTAINER_STYLES: Record<string, string> = {
  primary: "bg-indigo-500/10 border-indigo-500/20",
  secondary: "bg-white/5 border-white/10",
  success: "bg-green-500/10 border-green-500/20",
  warning: "bg-yellow-500/10 border-yellow-500/20",
  danger: "bg-red-500/10 border-red-500/20",
  info: "bg-blue-500/10 border-blue-500/20",
};

const TEXT_STYLES: Record<string, string> = {
  primary: "text-indigo-400",
  secondary: "text-white/60",
  success: "text-green-400",
  warning: "text-yellow-400",
  danger: "text-red-400",
  info: "text-blue-400",
};

export function VoyageBadge({
  children,
  className = "",
  variant = "primary",
}: VoyageBadgeProps) {
  const containerClasses =
    CONTAINER_STYLES[variant] ?? CONTAINER_STYLES.primary;
  const textClasses = TEXT_STYLES[variant] ?? TEXT_STYLES.primary;

  return (
    <View
      className={`items-center px-2.5 py-1 rounded-full border ${containerClasses} ${className}`}
    >
      {/*
        ✅ children DOIT être dans un <Text> sur native.
        Ici, VoyageBadge est utilisé avec du texte brut (amenities),
        donc c'est safe de le wrapper.
      */}
      <Text className={`text-[10px] font-bold tracking-wider ${textClasses}`}>
        {children}
      </Text>
    </View>
  );
}
