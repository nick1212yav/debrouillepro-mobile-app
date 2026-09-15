import { View, Image, Text } from "react-native";
import React from "react";
import { RatingStars } from "../common/RatingStars";

interface ReviewCardProps {
  review: {
    id: string;
    authorName: string;
    authorAvatar?: string;
    rating: number;
    date: string;
    text: string;
    photos?: string[];
  };
  className?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  className = "",
}) => {
  const { authorName, authorAvatar, rating, date, text, photos } = review;
  const initials = authorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 ${className}`}><View className="flex items-center justify-between gap-2"><View className="flex items-center gap-2.5">{authorAvatar ? (
            <Image className="w-10 h-10 rounded-full object-cover border border-white/5" source={{ uri: authorAvatar }} accessibilityLabel={authorName} />
          ) : (
            <View className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/15 uppercase">{initials}</View>
          )}<View className="flex flex-col min-w-0"><Text className="text-xs font-semibold text-white truncate">{authorName}</Text><Text className="text-[10px] text-white/40">{date}</Text></View></View><RatingStars rating={rating} showText={false} /></View><Text className="text-xs text-white/75 leading-relaxed">{text}</Text>{photos && photos.length > 0 && (
        <View className="flex gap-1.5 mt-1 overflow-x-auto pb-1 no-scrollbar">
          {photos.map((photo, i) => (
            <Image key={i} className="w-14 h-14 rounded-lg object-cover border border-white/5 active:scale-95 transition-all" source={{ uri: photo }} accessibilityLabel={`Review attachment ${i + 1}`} />
          ))}
        </View>
      )}</View>
  );
};
