import { Text, View } from "react-native";
import React from "react";
import { Bed, Bath, Square, Users } from "lucide-react-native";

export type RoomBadgeType = "beds" | "baths" | "area" | "guests" | "bedrooms";

interface RoomBadgeProps {
  type: RoomBadgeType;
  value: number | string;
  className?: string;
}

const BADGE_MAP: Record<
  RoomBadgeType,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    unit: string;
  }
> = {
  bedrooms: { icon: Bed, unit: "chambre" },
  beds: { icon: Bed, unit: "lit" },
  baths: { icon: Bath, unit: "SDB" },
  area: { icon: Square, unit: "m²" },
  guests: { icon: Users, unit: "voyageur" },
};

export const RoomBadge: React.FC<RoomBadgeProps> = ({
  type,
  value,
  className = "",
}) => {
  const config = BADGE_MAP[type];
  if (!config) return null;

  const Icon = config.icon;
  const isPlural = typeof value === "number" && value > 1;
  const suffix = isPlural && config.unit !== "m²" ? "s" : "";
  const displayLabel = `${value} ${config.unit}${suffix}`;

  return (
    <View className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-medium ${className}`}>
      <Icon size={12} className="text-indigo-400" />
      <Text>{displayLabel}</Text>
    </View>
  );
};
