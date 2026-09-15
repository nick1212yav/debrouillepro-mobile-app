import { View, Image, Text, Pressable } from "react-native";

// src/features/marketplace/components/SellerCard.tsx
import { Check, Star, MessageCircle } from "lucide-react-native";
import { formatCompactNumber, formatDate } from "../utils/formatter";
import type { Seller } from "../types";

interface Props {
  seller: Seller;
  onContact?: () => void;
}

export function SellerCard({ seller, onContact }: Props) {
  return (
    <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-3">{seller.avatar ? (
          <Image className="w-12 h-12 rounded-full object-cover" source={{ uri: seller.avatar }} accessibilityLabel={seller.name} />
        ) : (
          <View className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white bg-orange-500">{seller.name[0]}</View>
        )}<View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-white font-semibold text-sm truncate">{seller.name}</Text>{seller.verified && (
              <Check size={14} className="text-green-400 flex-shrink-0" />
            )}</View><View className="flex items-center gap-3 text-xs text-white/40">{seller.rating !== undefined && seller.rating > 0 && (
              <Text className="flex items-center gap-0.5 text-yellow-400">
                <Star size={11} fill="currentColor" />{" "}
                {seller.rating.toFixed(1)}
              </Text>
            )}<Text>{formatCompactNumber(seller.totalSales)}ventes</Text><Text>Membre depuis {formatDate(seller.joinDate)}</Text></View></View>{onContact && (
          <Pressable onPress={onContact} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{  }}>
            <MessageCircle size={12} /> Contacter
          </Pressable>
        )}</View></View>
  );
}
