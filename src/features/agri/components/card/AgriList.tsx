import { View, Text, Image, Pressable, GestureResponderEvent } from "react-native";

// src/features/agri/components/card/AgriList.tsx
import { Heart, MapPin, Star, ShieldCheck } from "lucide-react-native";
import type { AgriProduct } from "../../types/product.types";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from "../../constants/agri.categories";

interface AgriListProps {
  products?: AgriProduct[];
  isLoading: boolean;
  favorites?: string[];
  onToggleFavorite?: (id: string, e: GestureResponderEvent) => void;
  onSelectProduct?: (id: string) => void;
}

export function AgriList({
  products,
  isLoading,
  favorites = [],
  onToggleFavorite,
  onSelectProduct,
}: AgriListProps) {
  const formatPrice = (price: number, currency: string) => {
    if (currency === "CDF") {
      return `${price.toLocaleString("fr-FR")} CDF`;
    }
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <View className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => (
          <View key={i} className="flex gap-4 p-3 rounded-[24px] bg-white/[0.01] border border-white/5 animate-pulse"><View className="w-24 h-24 rounded-[16px] bg-white/[0.03] flex-shrink-0" /><View className="flex-1 space-y-3 py-1"><View className="h-3.5 bg-white/[0.04] rounded-lg w-2/3" /><View className="h-2.5 bg-white/[0.03] rounded-lg w-full" /><View className="flex justify-between items-center pt-2"><View className="h-3.5 bg-white/[0.04] rounded-lg w-1/4" /><View className="h-3 bg-white/[0.03] rounded-lg w-12" /></View></View></View>
        ))}</View>
    );
  }

  if (!products || products.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-12 text-center"><Text className="text-3xl mb-2">🌾</Text><Text className="text-white/40 text-xs">Aucun produit agricole disponible
        </Text></View>
    );
  }

  return (
    <View className="flex flex-col gap-3">{products.map((product) => (
        <View key={product._id} whileTap={{ scale: 0.99 }} onPress={() => onSelectProduct?.(product._id)} className="group relative flex gap-4 p-3 rounded-[24px] bg-white/[0.02] border border-white/5 transition-all duration-300">
          {/* Section gauche : Image ou Icône */}
          <View className="relative w-24 h-24 rounded-[18px] overflow-hidden bg-white/[0.01] flex-shrink-0">{product.media.images && product.media.images.length > 0 ? (
              <Image className="w-full h-full object-cover transition-transform duration-500" source={{ uri: product.media.images[0] }} accessibilityLabel={product.title} />
            ) : (
              <View className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-white/[0.02] to-transparent">{CATEGORY_ICONS[product.category] || "🌱"}</View>
            )}</View>

          {/* Section droite : Informations détaillées */}
          <View className="flex-1 min-w-0 flex flex-col justify-between py-1"><View><View className="flex items-start justify-between gap-2"><Text className="text-white font-semibold text-xs leading-snug truncate transition-colors">{product.title}</Text>{onToggleFavorite && (
                  <Pressable onPress={(e) => {
                      onToggleFavorite(product._id, e);
                    }} className="text-white/40 transition-colors"><Heart size={14} className={
                        favorites.includes(product._id)
                          ? "fill-red-500 text-red-500"
                          : ""
                      } /></Pressable>
                )}</View><Text className="text-white/40 text-[10px] leading-relaxed mt-0.5">{product.description}</Text></View>{}<View className="flex items-center gap-3 text-[10px] text-white/50"><View className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-500 text-yellow-500" /><Text className="font-medium text-white/70">{product.seller.rating.toFixed(1)}</Text></View><View className="flex items-center gap-0.5 truncate"><MapPin size={10} className="text-white/30 flex-shrink-0" /><Text className="truncate">{product.location.city}</Text></View></View>{}<View className="flex items-center justify-between gap-2 pt-1"><Text className="text-green-400 font-bold text-xs">{formatPrice(product.pricing.price, product.pricing.currency)}<Text className="text-white/40 font-normal text-[9px]">{" "}/ {product.pricing.priceUnit}</Text></Text><View className="flex items-center gap-1.5"><View className="px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider" style={{ backgroundColor: `${CATEGORY_COLORS[product.category]}1a` }}>{CATEGORY_LABELS[product.category]}</View>{product.seller.verified && (
                  <ShieldCheck
                    size={12}
                    className="text-emerald-400 flex-shrink-0"
                  />
                )}</View></View></View>
        </View>
      ))}</View>
  );
}
