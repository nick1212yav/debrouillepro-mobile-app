import { Text, View } from "react-native";
import React from "react";
import { CheckCircle2, XCircle } from "lucide-react-native";

interface AvailabilityBadgeProps {
  available: boolean;
  className?: string;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  available,
  className = "",
}) => {
  return (
    <View
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        available
          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
      } ${className}`}
    >
      {available ? (
        <>
          <CheckCircle2 size={12} />
          <Text>Disponible</Text>
        </>
      ) : (
        <>
          <XCircle size={12} />
          <Text>Indisponible</Text>
        </>
      )}
    </View>
  );
};
