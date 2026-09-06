import { View, Text, Image } from "react-native";
// src/features/marketplace/components/SellerHeader.tsx
import { Check, Star, MapPin } from "lucide-react-native";
import { formatCompactNumber } from "../utils/formatter";

interface Props {
  name: string;
  avatar?: string;
  verified: boolean;
  rating?: number;
  reviewCount: number;
  totalSales: number;
  location?: string;
  joinedAt: number;
}

export function SellerHeader({
  name,
  avatar,
  verified,
  rating,
  reviewCount,
  totalSales,
  location,
  joinedAt,
}: Props) {
  return (
    <View
      className="flex items-start gap-4 p-4 rounded-2xl"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      {avatar ? (
        <Image
         
         
          className="w-16 h-16 rounded-full object-cover"
         source={{ uri: avatar }} accessibilityLabel={name}/>
      ) : (
        <View className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-orange-500">
          {name[0]}
        </View>
      )}
      <View className="flex-1">
        <View className="flex items-center gap-1.5">
          <Text className="text-white font-bold text-lg">{name}</Text>
          {verified && <Check size={16} className="text-green-400" />}
        </View>
        <View className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
          {rating !== undefined && rating > 0 && (
            <Text className="flex items-center gap-0.5 text-yellow-400">
              <Star size={12} fill="currentColor" /> {rating.toFixed(1)} <Text>(</Text>{reviewCount}<Text>)</Text></Text>
          )}
          <Text>{formatCompactNumber(totalSales)} <Text>ventes</Text></Text>
          {location && (
            <Text className="flex items-center gap-0.5">
              <MapPin size={10} /> {location}
            </Text>
          )}
          <Text><Text>Membre depuis</Text>{new Date(joinedAt).getFullYear()}</Text>
        </View>
      </View>
    </View>
  );
}
