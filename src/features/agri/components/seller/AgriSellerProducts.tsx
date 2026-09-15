import { View, Text } from "react-native";

// src/features/agri/components/seller/AgriSellerProducts.tsx
import type { AgriProduct } from "../../types/product.types";
import { AgriCard } from "../card/AgriCard";
import { AgriCardSkeleton } from "../card/AgriCardSkeleton";

interface AgriSellerProductsProps {
  products?: AgriProduct[];
  isLoading: boolean;
  onSelectProduct?: (id: string) => void;
}

export function AgriSellerProducts({
  products,
  isLoading,
  onSelectProduct,
}: AgriSellerProductsProps) {
  if (isLoading) {
    return (
      <View className="space-y-3"><Text className="text-xs font-bold text-white/40 uppercase tracking-widest">Autres récoltes du producteur
        </Text><View className="gap-3">{Array.from({ length: 2 }).map((_, i) => (
            <AgriCardSkeleton key={i} />
          ))}</View></View>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <View className="space-y-3"><Text className="text-xs font-bold text-white/40 uppercase tracking-widest">Autres récoltes du producteur
      </Text><View className="gap-3">{products.slice(0, 4).map((product) => (
          <AgriCard
            key={product._id}
            product={product}
            onPress={() => onSelectProduct?.(product._id)}
          />
        ))}</View></View>
  );
}
