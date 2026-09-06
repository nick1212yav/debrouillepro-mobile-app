import { Text } from "react-native";

// src/features/agri/components/common/AgriUnitBadge.tsx
import type { AgriUnit } from "../../types/product.types";

interface AgriUnitBadgeProps {
  quantity: number;
  unit: AgriUnit;
  className?: string;
}

export function AgriUnitBadge({
  quantity,
  unit,
  className = "",
}: AgriUnitBadgeProps) {
  const formatUnitLabel = (u: AgriUnit, count: number) => {
    const labels: Record<AgriUnit, string> = {
      kg: "kg",
      tonne: count > 1 ? "tonnes" : "tonne",
      sac: count > 1 ? "sacs" : "sac",
      botte: count > 1 ? "bottes" : "botte",
      piece: count > 1 ? "pièces" : "pièce",
      litre: "litres",
      hectare: count > 1 ? "hectares" : "hectare",
    };
    return labels[u] || u;
  };

  return (
    <Text
      className={`inline-flex items-center px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-[9px] text-white/50 ${className}`}
    >
      {quantity.toLocaleString("fr-FR")} {formatUnitLabel(unit, quantity)}
    </Text>
  );
}
