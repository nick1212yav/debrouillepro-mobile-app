import { View, Image, Pressable, Text, GestureResponderEvent } from "react-native";

// src/features/agri/components/card/AgriCard.tsx
import { Heart, MapPin, Star, ShieldCheck } from "lucide-react-native";
import type { AgriProduct } from "../../types/product.types";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from "../../constants/agri.categories";

interface AgriCardProps {
  product: AgriProduct;
  isFavorite?: boolean;
  onToggleFavorite?: (e: GestureResponderEvent) => void;
  onClick?: () => void;
}

export function AgriCard({
  product,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}: AgriCardProps) {
  // Formatage des devises (CDF pour la RDC et standard international pour le reste)
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

  return (
    <View whileTap={{ scale: 0.98 }} onPress={onClick} className="group relative flex flex-col w-full rounded-[24px] overflow-hidden bg-white/[0.02] border border-white/5 transition-all duration-300">
      {/* Container de l'image */}
      <View className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.01]">{product.media.images && product.media.images.length > 0 ? (
          <Image className="w-full h-full object-cover transition-transform duration-500" source={{ uri: product.media.images[0] }} accessibilityLabel={product.title} />
        ) : (
          <View className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-white/[0.02] to-transparent">{CATEGORY_ICONS[product.category] || "🌱"}</View>
        )}{}{onToggleFavorite && (
          <Pressable onPress={(e) => {
              onToggleFavorite(e);
            }} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/5 active:scale-90 transition-transform"><Heart size={15} className={
                isFavorite ? "fill-red-500 text-red-500" : "text-white/80"
              } /></Pressable>
        )}{}<View className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider backdrop-blur-md border border-white/5" style={{ backgroundColor: `${CATEGORY_COLORS[product.category]}1a` }}>{CATEGORY_LABELS[product.category]}</View></View>

      {/* Informations textuelles */}
      <View className="p-3.5 flex flex-col flex-1 justify-between gap-2.5"><View className="space-y-1"><Text className="text-white font-semibold text-xs leading-snug transition-colors">{product.title}</Text><Text className="text-white/40 text-[10px] leading-relaxed">{product.description}</Text></View>{}<View className="flex items-center justify-between gap-1 text-[10px] text-white/50"><View className="flex items-center gap-1"><Star size={11} className="fill-yellow-500 text-yellow-500" /><Text className="font-medium text-white/70">{product.seller.rating.toFixed(1)}</Text><Text className="text-white/30">({product.seller.reviewCount})
            </Text></View><View className="flex items-center gap-0.5 truncate"><MapPin size={11} className="text-white/30 flex-shrink-0" /><Text className="truncate">{product.location.city}</Text></View></View>{}<View className="pt-2 border-t border-white/5 flex items-center justify-between gap-2"><Text className="text-green-400 font-bold text-xs">{formatPrice(product.pricing.price, product.pricing.currency)}<Text className="text-white/40 font-normal text-[10px]">{" "}/ {product.pricing.priceUnit}</Text></Text>{product.seller.verified && (
            <Text className="flex items-center" title="Vendeur vérifié">
              {" "}
              {/* ✅ Enveloppé dans un span standard pour corriger TS2322 */}
              <ShieldCheck
                size={14}
                className="text-emerald-400 flex-shrink-0"
              />
            </Text>
          )}</View></View>
    </View>
  );
}
