import { View, Text } from "react-native";

// src/features/voyages/components/common/VoyageEmptyState.tsx
import type { ReactNode } from "react"; // ✅ Correction : import type unifié [1]

interface VoyageEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function VoyageEmptyState({
  title,
  description,
  icon,
  action,
}: VoyageEmptyStateProps) {
  return (
    <View className="flex flex-col items-center justify-center p-8 text-center bg-white/[0.01] border border-white/5 rounded-3xl">
      {icon && <View className="text-white/20 mb-3">{icon}</View>}
      <Text className="text-sm font-bold text-white/80">{title}</Text>
      {description && (
        <Text className="text-white/40 text-xs mt-1 max-w-xs">{description}</Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
