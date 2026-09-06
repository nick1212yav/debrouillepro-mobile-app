import { View, Text, Image } from "react-native";
// src/features/profile/components/MiniPubCard.tsx

import { Heart, MessageCircle } from "lucide-react-native";
import { TYPE_COLORS, TYPE_LABELS } from "@/hooks/use-publications";
import type { PublicationType } from "@/hooks/use-publications";

interface MiniPubCardProps {
  pub: {
    _id: string;
    title: string;
    type: PublicationType;
    images: string[];
    likeCount: number;
    commentCount: number;
    price?: string;
  };
}

export function MiniPubCard({ pub }: MiniPubCardProps) {
  const color = TYPE_COLORS[pub.type];
  const label = TYPE_LABELS[pub.type];
  const hasImage = pub.images.length > 0;

  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderStyle: "solid" }}
    >
      {hasImage ? (
        <View className="relative h-24">
          <Image
           
           
            className="w-full h-full object-cover"
            loading="lazy"
           source={{ uri: pub.images[0] }} accessibilityLabel={pub.title}/>
          <View
            className="absolute inset-0"
            style={{  }}
          />
          <View
            className="absolute bottom-1.5 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </View>
        </View>
      ) : (
        <View
          className="h-12 flex items-center px-3"
          style={{ backgroundColor: `${color}15` }}
        >
          <Text
            className="text-[10px] font-bold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </Text>
        </View>
      )}
      <View className="p-2.5">
        <Text className="text-white text-xs font-semibold leading-tight mb-1.5">
          {pub.title}
        </Text>
        {pub.price && (
          <Text className="text-green-400 text-xs font-black mb-1">{pub.price}</Text>
        )}
        <View className="flex items-center gap-2 text-white/35 text-[10px]">
          <Text className="flex items-center gap-0.5">
            <Heart size={9} />
            {pub.likeCount}
          </Text>
          <Text className="flex items-center gap-0.5">
            <MessageCircle size={9} />
            {pub.commentCount}
          </Text>
        </View>
      </View>
    </View>
  );
}
