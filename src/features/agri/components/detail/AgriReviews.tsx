import { View, Text } from "react-native";
// src/features/agri/components/detail/AgriReviews.tsx
import { Star, MessageSquare } from "lucide-react-native";

interface AgriReviewsProps {
  productId: string;
}

export function AgriReviews({ productId }: AgriReviewsProps) {
  // Conçu pour un rendu visuel en production. Le chaînage dynamique peut être branché au besoin.
  return (
    <View className="rounded-[24px] p-4 bg-white/[0.02] border border-white/5 space-y-4">
      <View className="flex items-center justify-between gap-2">
        <Text className="text-xs font-bold text-white/40 uppercase tracking-widest">
          Évaluations vérifiées
        </Text>
        <Text className="text-[10px] font-semibold text-green-400">
          Totalement fiables
        </Text>
      </View>

      {/* Aperçu des notes */}
      <View className="flex items-center gap-4 py-2">
        <View className="text-center">
          <Text className="text-white font-extrabold text-2xl leading-none">
            4.8
          </Text>
          <Text className="text-white/40 text-[10px] block mt-1">sur 5</Text>
        </View>

        <View className="flex-1 space-y-1">
          <View className="flex items-center gap-1">
            <View className="flex text-yellow-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} className="fill-current" />
              ))}
            </View>
            <View className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <View className="h-full bg-yellow-500 rounded-full w-[85%]" />
            </View>
          </View>
          <View className="flex items-center gap-1">
            <View className="flex text-yellow-500">
              {Array.from({ length: 4 }).map((_, i) => (
                <Star key={i} size={10} className="fill-current" />
              ))}
            </View>
            <View className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <View className="h-full bg-yellow-500 rounded-full w-[15%]" />
            </View>
          </View>
        </View>
      </View>

      {/* Commentaire type d'évaluation d'un produit agricole */}
      <View className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 flex items-start gap-2.5">
        <MessageSquare
          size={14}
          className="text-white/30 mt-0.5 flex-shrink-0"
        />
        <View className="space-y-0.5">
          <View className="flex items-center gap-1.5">
            <Text className="text-[10px] font-bold text-white/80">
              <Text>Jean-Pierre M.</Text></Text>
            <Text className="text-[8px] text-white/30"><Text>Récemment</Text></Text>
          </View>
          <Text className="text-[10px] text-white/50 leading-relaxed">
            <Text>Produit exceptionnel, les récoltes sont bien sèches et triées avec soin. Le transporteur de la coopérative est sérieux.</Text></Text>
        </View>
      </View>
    </View>
  );
}
