import { Pressable, View } from "react-native";

// src/features/marketplace/components/ProductActions.tsx
import {
  Heart,
  Share2,
  GitCompare,
  Flag,
  ShoppingCart,
  Zap,
} from "lucide-react-native";

interface Props {
  onLike: () => void;
  onShare: () => void;
  onCompare: () => void;
  onReport: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isLiked: boolean;
  isInCart: boolean;
  disabled?: boolean;
}

export function ProductActions({
  onLike,
  onShare,
  onCompare,
  onReport,
  onAddToCart,
  onBuyNow,
  isLiked,
  isInCart,
  disabled = false,
}: Props) {
  return (
    <View className="flex flex-wrap items-center gap-2">
      <Pressable onPress={onLike} disabled={disabled} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-40" style={{ backgroundColor: isLiked
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(255,255,255,0.06)", borderColor: "rgba(239,68,68,0.3)", borderStyle: "solid" }}>
        <Heart size={16} className={isLiked ? "fill-red-500" : ""} />
        {isLiked ? "Favori" : "Ajouter"}
      </Pressable>

      <Pressable onPress={onShare} disabled={disabled} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white/60 transition-all active:scale-95 disabled:opacity-40" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <Share2 size={16} /> Partager
      </Pressable>

      <Pressable onPress={onCompare} disabled={disabled} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white/60 transition-all active:scale-95 disabled:opacity-40" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <GitCompare size={16} /> Comparer
      </Pressable>

      <Pressable onPress={onReport} disabled={disabled} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white/30 transition-all active:scale-95 disabled:opacity-40" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <Flag size={16} />
      </Pressable>
    </View>
  );
}
