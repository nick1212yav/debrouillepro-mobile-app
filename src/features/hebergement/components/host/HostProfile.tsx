import { View, Image, Text } from "react-native";
import React from "react";
import { Star, Calendar, Languages } from "lucide-react-native";
import { VerifiedBadge } from "../common/VerifiedBadge";

interface HostProfileProps {
  host: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    rating?: number;
    reviewsCount?: number;
    joinedDate?: string;
    description?: string;
    languages?: string[];
  };
  className?: string;
}

export const HostProfile: React.FC<HostProfileProps> = ({
  host,
  className = "",
}) => {
  const {
    name,
    avatar,
    verified,
    rating = 4.9,
    reviewsCount = 114,
    joinedDate = "Mars 2024",
    description = "Passionné de voyages et d'immobilier, je vous propose des logements de qualité entièrement équipés à Abidjan pour un séjour sans soucis.",
    languages = ["Français", "Anglais"],
  } = host;

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className={`p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 ${className}`}><View className="flex items-start gap-4">{avatar ? (
          <Image className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0" source={{ uri: avatar }} accessibilityLabel={name} />
        ) : (
          <View className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-base text-white bg-gradient-to-br from-indigo-500 to-purple-500 border border-white/10 shrink-0">{initials}</View>
        )}<View className="flex-1 flex flex-col gap-1"><View className="flex items-center gap-1.5 flex-wrap"><Text className="text-sm font-bold text-white">{name}</Text><VerifiedBadge verified={verified} /></View><View className="flex items-center gap-1 text-[10px] text-white/40 font-semibold"><Calendar size={12} className="text-indigo-400" /><Text>Membre depuis {joinedDate}</Text></View></View></View><Text className="text-xs text-white/70 leading-relaxed italic">"{description}"
      </Text><View className="gap-3.5 pt-3.5 border-t border-white/5 text-xs text-white/60"><View className="flex items-center gap-1.5"><Star size={14} className="text-amber-400 fill-amber-400 shrink-0" /><Text><strong className="text-white">{rating.toFixed(1)}</strong>(
            {reviewsCount}évaluations)
          </Text></View><View className="flex items-center gap-1.5"><Languages size={14} className="text-indigo-400 shrink-0" /><Text>Parle :{" "}<strong className="text-white">{languages.join(", ")}</strong></Text></View></View></View>
  );
};
