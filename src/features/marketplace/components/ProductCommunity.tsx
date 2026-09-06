import { Text, View } from "react-native";

// src/features/marketplace/components/ProductCommunity.tsx
import { Users, MessageCircle, Heart, Share2 } from "lucide-react-native";
import { formatCompactNumber } from "../utils/formatter";

interface Props {
  reviews: number;
  questions: number;
  followers: number;
  shares: number;
}

export function ProductCommunity({
  reviews,
  questions,
  followers,
  shares,
}: Props) {
  const stats = [
    { icon: MessageCircle, label: "Avis", value: reviews },
    { icon: Users, label: "Abonnés", value: followers },
    { icon: Heart, label: "Favoris", value: 0 },
    { icon: Share2, label: "Partages", value: shares },
  ];

  return (
    <View className="gap-2">
      {stats.map((stat) => (
        <View
          key={stat.label}
          className="p-2 rounded-xl text-center bg-white/5 border border-white/5"
        >
          <stat.icon size={14} className="text-white/40 mx-auto mb-0.5" />
          <Text className="text-white font-bold text-sm">
            {formatCompactNumber(stat.value)}
          </Text>
          <Text className="text-white/30 text-[9px]">{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
