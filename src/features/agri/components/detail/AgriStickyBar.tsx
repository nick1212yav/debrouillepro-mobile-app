import { View, Pressable } from "react-native";

// src/features/agri/components/detail/AgriStickyBar.tsx
import { MessageCircle, ShoppingBag } from "lucide-react-native";
import type { AgriProduct } from "../../types/product.types";

interface AgriStickyBarProps {
  product: AgriProduct;
  onContact?: () => void;
  onBuy?: () => void;
}

export function AgriStickyBar({
  product,
  onContact,
  onBuy,
}: AgriStickyBarProps) {
  return (
    <View className="absolute bottom-0 left-0 right-0 z-30 px-5 py-4 bg-black/60 backdrop-blur-lg border-t border-white/5 flex items-center gap-2.5">
      <Pressable whileTap={{ scale: 0.95 }} onPress={onContact} className="flex-1 h-12 rounded-2xl bg-white/[0.04] border border-white/5 text-white/80 font-bold text-xs transition-colors flex items-center justify-center gap-2">
        <MessageCircle size={15} />
        Négocier
      </Pressable>

      <Pressable whileTap={{ scale: 0.95 }} onPress={onBuy} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-green-500/10 flex items-center justify-center gap-2">
        <ShoppingBag size={15} />
        Commander
      </Pressable>
    </View>
  );
}
