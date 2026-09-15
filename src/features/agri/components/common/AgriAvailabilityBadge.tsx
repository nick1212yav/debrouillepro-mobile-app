import { View } from "react-native";

// src/features/agri/components/common/AgriAvailabilityBadge.tsx
interface AgriAvailabilityBadgeProps {
  status: "available" | "limited" | "sold_out" | "pre_order";
  className?: string;
}

export function AgriAvailabilityBadge({
  status,
  className = "",
}: AgriAvailabilityBadgeProps) {
  const config = {
    available: {
      label: "En stock",
      styles: "text-green-400 bg-green-500/10 border-green-500/20",
    },
    limited: {
      label: "Stock limité",
      styles: "text-amber-400 bg-orange-500/10 border-orange-500/20",
    },
    sold_out: {
      label: "Épuisé",
      styles: "text-red-400 bg-red-500/10 border-red-500/20",
    },
    pre_order: {
      label: "Pré-commande",
      styles: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
  };

  const active = config[status] || config.available;

  return (
    <View className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border ${active.styles} ${className}`}>
      {active.label}
    </View>
  );
}
