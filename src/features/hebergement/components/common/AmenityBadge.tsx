import { Text, View } from "react-native";
import React from "react";
import {
  Wifi,
  Car,
  Utensils,
  Waves,
  Snowflake,
  Tv,
  Dumbbell,
  PawPrint,
  Sparkles,
  HelpCircle,
} from "lucide-react-native";

export type AmenityKey =
  | "wifi"
  | "parking"
  | "cuisine"
  | "piscine"
  | "climatisation"
  | "tv"
  | "gym"
  | "animaux"
  | "spa";

interface AmenityBadgeProps {
  amenity: string;
  showLabel?: boolean;
  className?: string;
}

const AMENITY_MAP: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
  }
> = {
  wifi: { icon: Wifi, label: "WiFi" },
  parking: { icon: Car, label: "Parking" },
  cuisine: { icon: Utensils, label: "Cuisine" },
  piscine: { icon: Waves, label: "Piscine" },
  climatisation: { icon: Snowflake, label: "Climatisation" },
  tv: { icon: Tv, label: "Télévision" },
  gym: { icon: Dumbbell, label: "Salle de sport" },
  animaux: { icon: PawPrint, label: "Animaux admis" },
  spa: { icon: Sparkles, label: "Spa" },
};

export const AmenityBadge: React.FC<AmenityBadgeProps> = ({
  amenity,
  showLabel = true,
  className = "",
}) => {
  const normKey = amenity.toLowerCase().trim();
  const config = AMENITY_MAP[normKey] || { icon: HelpCircle, label: amenity };
  const Icon = config.icon;

  return (
    <View className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 ${className}`}>
      <Icon size={14} className="text-indigo-400" />
      {showLabel && <Text className="text-xs font-medium">{config.label}</Text>}
    </View>
  );
};
