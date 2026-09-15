import { View, Image, Text } from "react-native";
import { Star } from "lucide-react-native";
import type { ReviewRecord } from "../../types/review.types";

interface ReviewCardProps {
  review: ReviewRecord;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View className="p-4 rounded-2xl flex flex-col gap-3 text-left" style={{ backgroundColor: "rgba(255,255,255,0.02)", borderWidth: 1, borderColor: "rgba(255,255,255,0.04)", borderStyle: "solid" }}><View className="flex justify-between items-center"><View className="flex items-center gap-2.5 min-w-0"><View className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/25 flex items-center justify-center font-black text-xs text-orange-400 uppercase shrink-0">{review.userAvatar ? (
              <Image className="w-full h-full object-cover rounded-full" source={{ uri: review.userAvatar }} accessibilityLabel={review.userName} />
            ) : (
              review.userName.charAt(0)
            )}</View><View className="min-w-0"><Text className="block text-xs font-extrabold text-white truncate">{review.userName}</Text><Text className="block text-[9px] text-white/30 mt-0.5">{formattedDate}</Text></View></View><View className="flex gap-0.5 shrink-0">{[...Array(5)].map((_, index) => (
            <Star
              key={index}
              size={11}
              className={
                index < review.rating
                  ? "text-amber-400 fill-amber-400"
                  : "text-white/10"
              }
            />
          ))}</View></View><Text className="text-xs text-white/70 leading-relaxed font-normal italic">"{review.comment}"
      </Text>{review.responseFromOwner && (
        <View className="p-3 rounded-xl bg-orange-500/5 border-l-2 border-orange-500 mt-1 space-y-1">
          <Text className="block text-[9px] text-orange-400 uppercase font-black tracking-wider">
            Réponse du propriétaire
          </Text>
          <Text className="text-xs text-white/60 font-normal leading-snug">
            {review.responseFromOwner}
          </Text>
        </View>
      )}</View>
  );
}
