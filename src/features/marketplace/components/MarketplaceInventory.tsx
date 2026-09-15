import { View, Text } from "react-native";

// src/features/marketplace/components/MarketplaceInventory.tsx
import { Package, AlertTriangle, CheckCircle } from "lucide-react-native";
import { formatCompactNumber } from "../utils/formatter";

interface Props {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export function MarketplaceInventory({
  totalProducts,
  inStock,
  lowStock,
  outOfStock,
}: Props) {
  return (
    <View className="space-y-3"><View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"><Text className="text-white/60 text-sm">Total produits</Text><Text className="text-white font-bold">{formatCompactNumber(totalProducts)}</Text></View><View className="gap-2"><View className="p-3 rounded-xl text-center bg-green-500/10 border border-green-500/15"><Package size={14} className="text-green-400 mx-auto mb-0.5" /><Text className="text-white font-bold">{formatCompactNumber(inStock)}</Text><Text className="text-white/30 text-[9px]">En stock</Text></View><View className="p-3 rounded-xl text-center bg-amber-500/10 border border-amber-500/15"><AlertTriangle size={14} className="text-amber-400 mx-auto mb-0.5" /><Text className="text-white font-bold">{formatCompactNumber(lowStock)}</Text><Text className="text-white/30 text-[9px]">Stock faible</Text></View><View className="p-3 rounded-xl text-center bg-red-500/10 border border-red-500/15"><AlertTriangle size={14} className="text-red-400 mx-auto mb-0.5" /><Text className="text-white font-bold">{formatCompactNumber(outOfStock)}</Text><Text className="text-white/30 text-[9px]">Épuisé</Text></View></View></View>
  );
}
