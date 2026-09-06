import { View, Text } from "react-native";
import { Star } from "lucide-react-native";

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface TransportReviewsProps {
  reviews?: Review[];
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: "1",
    user: "Patrick K.",
    rating: 5,
    comment:
      "Chauffeur très ponctuel. Véhicule extrêmement propre et climatisé. Je recommande vivement.",
    date: "Il y a 3 jours",
  },
];

export function TransportReviews({
  reviews = DEFAULT_REVIEWS,
}: TransportReviewsProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
      <View className="flex items-center justify-between">
        <Text className="text-[10px] font-black text-white/40 uppercase tracking-widest">
          Avis des passagers
        </Text>
        <Text className="text-xs text-amber-400 font-bold">★ 4.97</Text>
      </View>
      <View className="space-y-3">
        {reviews.map((rev) => (
          <View
            key={rev.id}
            className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-1"
          >
            <View className="flex items-center justify-between">
              <Text className="text-xs font-bold text-white">{rev.user}</Text>
              <View className="flex text-amber-400">
                {Array.from({ length: rev.rating }).map((_, idx) => (
                  <Star key={idx} size={8} className="fill-amber-400" />
                ))}
              </View>
            </View>
            <Text className="text-[11px] text-white/60 leading-relaxed">
              {rev.comment}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
