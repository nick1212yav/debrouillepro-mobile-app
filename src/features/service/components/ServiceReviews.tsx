import { View, Text } from "react-native";
import { Star, User } from "lucide-react-native";
import { useServiceReviews } from "../hooks/useServiceReviews";
import type { Id } from "@/convex/_generated/dataModel";

export function ServiceReviews({
  providerId,
}: {
  providerId: Id<"serviceProviders">;
}) {
  const { reviews, loading } = useServiceReviews(providerId);
  if (loading)
    return <View className="text-white/40 text-sm"><Text>Chargement...</Text></View>;
  if (reviews.length === 0)
    return <View className="text-white/30 text-sm"><Text>Aucun avis</Text></View>;
  return (
    <View className="space-y-3"><Text className="text-sm font-medium text-white/50">Avis</Text>{reviews.slice(0, 5).map((r) => (
        <View key={r._id} className="p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center gap-2"><User size={14} className="text-white/30" /><Text className="text-white/80 text-sm">{r.reviewerName}</Text><View className="flex items-center">{Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={
                    i < r.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-white/20"
                  }
                />
              ))}</View></View><Text className="text-white/60 text-sm mt-1">{r.comment}</Text></View>
      ))}</View>
  );
}
