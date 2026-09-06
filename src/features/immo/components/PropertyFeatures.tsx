import { View, Text } from "react-native";
import {
  Ruler,
  Bath,
  BedDouble,
  Home,
  Car,
  Wifi,
  Sun,
  Droplets,
} from "lucide-react-native";

interface Props {
  type: string;
  surface: number | null;
  rooms: number | null;
  bathrooms: number | null;
  amenities: string[];
}

export function PropertyFeatures({
  type,
  surface,
  rooms,
  bathrooms,
  amenities,
}: Props) {
  const features = [
    { icon: Home, label: type },
    { icon: Ruler, label: surface ? `${surface} m²` : null },
    { icon: BedDouble, label: rooms ? `${rooms} pièces` : null },
    { icon: Bath, label: bathrooms ? `${bathrooms} sdb` : null },
  ].filter((f) => f.label);

  const hasAmenities = amenities && amenities.length > 0;

  return (
    <View>
      <Text className="text-sm font-medium text-white/70 mb-2">
        Caractéristiques
      </Text>
      <View className="gap-2">
        {features.map((feature, idx) => (
          <View
            key={idx}
            className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2"
          >
            <feature.icon size={14} className="text-white/40" />
            <Text className="text-xs text-white/60">{feature.label}</Text>
          </View>
        ))}
        {hasAmenities && (
          <View className="flex flex-wrap gap-1.5 mt-1">
            {amenities.slice(0, 6).map((amenity) => (
              <Text
                key={amenity}
                className="px-2.5 py-1 rounded-full text-[10px] font-medium text-white/50 bg-white/5 border border-white/5"
              >
                {amenity}
              </Text>
            ))}
            {amenities.length > 6 && (
              <Text className="px-2.5 py-1 rounded-full text-[10px] text-white/30">
                <Text>+</Text>{amenities.length - 6}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
