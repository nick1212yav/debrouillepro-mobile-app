import { View, Text } from "react-native";

// src/features/voyages/components/detail/VoyageReviews.tsx
import { Star, MessageCircle, Users } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageReviewsProps {
  trip: VoyageTrip;
}

export function VoyageReviews({ trip }: VoyageReviewsProps) {
  const rating = trip.rating ?? 0;
  const reviewCount = trip.reviewCount ?? 0;

  // Distribution simulée (à remplacer par les vraies données quand elles seront disponibles)
  const distribution = [
    { stars: 5, percentage: 82 },
    { stars: 4, percentage: 12 },
    { stars: 3, percentage: 4 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 1 },
  ];

  return (
    <View
      className="rounded-3xl p-6 bg-white/5 border border-white/10"
    >
      <View className="flex items-center gap-2 mb-4">
        <MessageCircle size={16} className="text-indigo-400" />
        <Text className="text-white font-bold text-base">Avis des voyageurs</Text>
      </View>

      <View className="flex flex-col md:flex-row gap-6">
        {/* Score global */}
        <View className="flex items-center gap-4 md:flex-col md:items-start md:min-w-[120px]">
          <View className="text-center">
            <Text className="text-white text-4xl font-black">
              {rating.toFixed(1)}
            </Text>
            <View className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={
                    s <= Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-white/20"
                  }
                />
              ))}
            </View>
            <Text className="text-white/40 text-xs mt-1">{reviewCount} avis</Text>
          </View>
          <View className="flex items-center gap-1.5 text-sm text-white/60 md:mt-2">
            <Users size={14} />
            <Text>Recommandé par 89% des voyageurs</Text>
          </View>
        </View>

        {/* Distribution des notes */}
        <View className="flex-1 space-y-1.5">
          {distribution.map(({ stars, percentage }) => (
            <View key={stars} className="flex items-center gap-2 text-sm">
              <Text className="text-white/40 w-6 text-right">{stars}</Text>
              <Star
                size={12}
                className="text-amber-400 fill-amber-400 flex-shrink-0"
              />
              <View className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <View
                  className="h-full rounded-full bg-amber-400/70"
                  style={{ width: `${percentage}%` }}
                />
              </View>
              <Text className="text-white/40 text-xs w-10">{percentage}<Text>%</Text></Text>
            </View>
          ))}
        </View>
      </View>

      {/* Note : aucun avis individuel pour l'instant */}
      <Text className="text-white/30 text-xs mt-4 italic">
        Les avis détaillés seront disponibles prochainement.
      </Text>
    </View>
  );
}
