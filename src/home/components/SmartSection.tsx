import { Pressable, View, Text } from "react-native";
import React from "react";
import type { ReactNode } from "react";

export interface SmartSectionProps {
  title: string;

  subtitle?: string;

  icon?: ReactNode;

  children: ReactNode;

  actionLabel?: string;

  onAction?: () => void;

  loading?: boolean;

  hidden?: boolean;

  className?: string;
}

export function SmartSection({
  title,
  subtitle,
  icon,
  children,
  actionLabel,
  onAction,
  loading = false,
  hidden = false,
  className = "",
}: SmartSectionProps) {
  if (hidden) {
    return null;
  }

  return (
    <View className={`relative ${className}`}>
      <View className="mb-4 flex items-start justify-between gap-4">
        <View className="flex min-w-0 items-start gap-3">
          {icon && (
            <View className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
              {icon}
            </View>
          )}

          <View className="min-w-0">
            <Text className="truncate text-lg font-bold text-white">{title}</Text>

            {subtitle && (
              <Text className="mt-1 text-sm text-gray-400">
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {actionLabel && onAction && (
          <Pressable
            onPress={onAction}
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-300"
          >
            {actionLabel}
          </Pressable>
        )}
      </View>

      {loading ? (
        <View className="gap-3">
          {Array.from({
            length: 3,
          }).map((_, index) => (
            <View
              key={`smart-section-skeleton-${index}`}
              className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </View>
      ) : (
        children
      )}
    </View>
  );
}

export default SmartSection;
