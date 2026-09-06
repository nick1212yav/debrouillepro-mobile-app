import { View, Text, GestureResponderEvent } from "react-native";

// src/features/agri/components/card/AgriGrid.tsx
import type { AgriProduct } from "../../types/product.types";
import { AgriCard } from "./AgriCard";
import { AgriCardSkeleton } from "./AgriCardSkeleton";

interface AgriGridProps {
  products?: AgriProduct[];
  isLoading: boolean;
  favorites?: string[];
  onToggleFavorite?: (id: string, e: GestureResponderEvent) => void;
  onSelectProduct?: (id: string) => void;
}

export function AgriGrid({
  products,
  isLoading,
  favorites = [],
  onToggleFavorite,
  onSelectProduct,
}: AgriGridProps) {
  if (isLoading) {
    return (
      <View className="gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <AgriCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-12 text-center">
        <Text className="text-3xl mb-2">🌾</Text>
        <Text className="text-white/40 text-xs">
          Aucun produit agricole disponible
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {products.map((product) => (
        <AgriCard
          key={product._id}
          product={product}
          isFavorite={favorites.includes(product._id)}
          onToggleFavorite={
            onToggleFavorite
              ? (e) => onToggleFavorite(product._id, e)
              : undefined
          }
          onPress={() => onSelectProduct?.(product._id)}
        />
      ))}
    </View>
  );
}
