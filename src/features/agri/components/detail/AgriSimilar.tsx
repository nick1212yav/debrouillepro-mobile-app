import { View, Text } from "react-native";

// src/features/agri/components/detail/AgriSimilar.tsx
import { ShoppingBag } from "lucide-react-native";

interface AgriSimilarProps {
  productId: string;
  onNavigate?: (route: string) => void;
}

export function AgriSimilar({ productId, onNavigate }: AgriSimilarProps) {
  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-4"><Text className="text-xs font-bold text-white/40 uppercase tracking-widest">Produits de la même catégorie
      </Text><View className="flex flex-col items-center justify-center py-6 text-center text-white/20 gap-2"><ShoppingBag size={24} className="stroke-[1.5]" /><Text className="text-[10px]">Recherche de récoltes similaires en cours...
        </Text></View></View>
  );
}
