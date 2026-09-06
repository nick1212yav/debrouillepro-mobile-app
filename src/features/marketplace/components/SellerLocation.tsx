import { Text, View } from "react-native";

// src/features/marketplace/components/SellerLocation.tsx
import { MapPin, Globe } from "lucide-react-native";

interface Props {
  city?: string;
  country?: string;
  address?: string;
}

export function SellerLocation({ city, country, address }: Props) {
  if (!city && !country) return null;

  return (
    <View className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
      <MapPin size={14} className="text-purple-400 flex-shrink-0" />
      <Text className="text-white/70 text-sm">
        {city}
        {country ? `, ${country}` : ""}
        {address && (
          <Text className="text-white/30 text-xs block">{address}</Text>
        )}
      </Text>
      <Globe size={12} className="text-white/20 ml-auto" />
    </View>
  );
}
