import { View, Text } from "react-native";
import { Star } from "lucide-react-native";
import { RestaurantReviewStats } from "./RestaurantReviewStats";

export function RestaurantReviews() {
  const reviews = [
    {
      name: "Yao K.",
      date: "Il y a 3 jours",
      text: "Le poisson était délicieusement assaisonné, l'attiéké d'une fraîcheur incroyable.",
      rating: 5,
    },
    {
      name: "Awa T.",
      date: "Il y a 1 semaine",
      text: "Réservation de table VIP impeccable pour l'anniversaire de ma sœur.",
      rating: 4,
    },
  ];

  return (
    <View className="px-4 py-4 border-t border-white/[0.04] bg-white/[0.01]">
      <View className="flex items-center justify-between mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-white">
          Avis Clients
        </Text>
        <Text className="text-xs text-orange-400 font-bold">
          Voir tous
        </Text>
      </View>

      <View className="mb-4">
        <RestaurantReviewStats />
      </View>

      <View className="space-y-3">
        {reviews.map((review, i) => (
          <View
            key={i}
            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left"
          >
            <View className="flex justify-between items-center mb-2">
              <View>
                <Text className="block text-xs font-extrabold text-white">
                  {review.name}
                </Text>
                <Text className="text-[9px] text-white/30">{review.date}</Text>
              </View>
              <View className="flex gap-0.5">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={10}
                    className={
                      index < review.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-white/10"
                    }
                  />
                ))}
              </View>
            </View>
            <Text className="text-xs text-white/60 leading-relaxed italic">
              <Text>"</Text>{review.text}<Text>"</Text></Text>
          </View>
        ))}
      </View>
    </View>
  );
}
