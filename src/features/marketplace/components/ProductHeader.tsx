import { View, Pressable } from "react-native";
// src/features/marketplace/components/ProductHeader.tsx
import { ArrowLeft, Share2, Heart } from "lucide-react-native";
import type { Product } from "../types";

interface Props {
  product: Product;
  onBack: () => void;
  onShare?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
}

export function ProductHeader({
  product,
  onBack,
  onShare,
  onLike,
  isLiked = false,
}: Props) {
  return (
    <View className="flex items-center justify-between p-4">
      <Pressable
        onPress={onBack}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40"
      >
        <ArrowLeft size={20} className="text-white" />
      </Pressable>

      <View className="flex items-center gap-2">
        <Pressable
          onPress={onShare}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40"
        >
          <Share2 size={18} className="text-white" />
        </Pressable>
        <Pressable
          onPress={onLike}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40"
        >
          <Heart
            size={18}
            className={isLiked ? "fill-red-500 text-red-500" : "text-white"}
          />
        </Pressable>
      </View>
    </View>
  );
}
