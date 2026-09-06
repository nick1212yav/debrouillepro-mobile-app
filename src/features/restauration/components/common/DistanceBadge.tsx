import { Text } from "react-native";
import { MapPin } from "lucide-react-native";

interface DistanceBadgeProps {
  distanceKm: number;
}

export function DistanceBadge({ distanceKm }: DistanceBadgeProps) {
  return (
    <Text className="inline-flex items-center gap-1 text-[10px] text-white/45">
      <MapPin size={11} className="text-orange-400" />
      {distanceKm.toFixed(1)} km
    </Text>
  );
}
