import { Text, View } from "react-native";

interface Props {
  amenities: string[];
  max?: number;
}

export function PropertyAmenities({ amenities, max = 5 }: Props) {
  if (!amenities || amenities.length === 0) return null;

  return (
    <View className="flex flex-wrap gap-1.5 mt-2">
      {amenities.slice(0, max).map((amenity) => (
        <Text
          key={amenity}
          className="px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white/50"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
        >
          {amenity}
        </Text>
      ))}
      {amenities.length > max && (
        <Text className="px-2.5 py-0.5 rounded-full text-[10px] text-white/30">
          +{amenities.length - max}
        </Text>
      )}
    </View>
  );
}
