import { View, Text } from "react-native";
// src/features/agri/components/detail/AgriProductInfo.tsx
import type { AgriProduct } from "../../types/product.types";
import { Tag, Sparkles, CheckCircle2 } from "lucide-react-native";

interface AgriProductInfoProps {
  product: AgriProduct;
}

export function AgriProductInfo({ product }: AgriProductInfoProps) {
  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-4">
      <View className="space-y-1">
        <Text className="text-white font-bold text-lg leading-tight">
          {product.title}
        </Text>
        <View className="flex flex-wrap gap-2 items-center text-[10px] text-white/40">
          {product.subcategory && (
            <Text className="flex items-center gap-1">
              <Tag size={10} /> {product.subcategory}
            </Text>
          )}
          {product.variety && (
            <Text className="flex items-center gap-1">
              <Sparkles size={10} /> Variété : {product.variety}
            </Text>
          )}
        </View>
      </View>

      <View className="gap-3 pt-3 border-t border-white/5">
        <View className="flex flex-col gap-0.5">
          <Text className="text-[10px] text-white/30 uppercase tracking-wider">
            <Text>Qualité</Text></Text>
          <Text className="text-xs text-white/80 font-semibold capitalize flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-green-400" />
            {product.quality}
          </Text>
        </View>
        {product.condition && (
          <View className="flex flex-col gap-0.5">
            <Text className="text-[10px] text-white/30 uppercase tracking-wider">
              <Text>État physique</Text></Text>
            <Text className="text-xs text-white/80 font-semibold capitalize">
              {product.condition}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
