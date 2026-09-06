import { View, Text, Pressable } from "react-native";
// src/features/sante/components/HealthHeader.tsx
import type { ReactNode } from "react";
import { ArrowLeft, Heart, Share2 } from "lucide-react-native";

interface HealthHeaderProps {
  title: string;
  onBack?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  isFavorite?: boolean;
  children?: ReactNode;
}

export function HealthHeader({
  title,
  onBack,
  onFavorite,
  onShare,
  isFavorite = false,
  children,
}: HealthHeaderProps) {
  return (
    <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3">
      {onBack && (
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
      )}
      <Text className="text-white font-bold text-lg flex-1 truncate">{title}</Text>
      <View className="flex items-center gap-1.5">
        {onFavorite && (
          <Pressable
            onPress={onFavorite}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <Heart
              size={18}
              className={
                isFavorite ? "fill-red-500 text-red-500" : "text-white/60"
              }
            />
          </Pressable>
        )}
        {onShare && (
          <Pressable
            onPress={onShare}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <Share2 size={18} className="text-white/60" />
          </Pressable>
        )}
        {children}
      </View>
    </View>
  );
}
