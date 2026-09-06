import { View, Text } from "react-native";

// src/features/voyages/components/detail/VoyageAvailability.tsx
import { Users, AlertCircle, CheckCircle } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageAvailabilityProps {
  trip: VoyageTrip;
}

export function VoyageAvailability({ trip }: VoyageAvailabilityProps) {
  const available = trip.availableSeats ?? 0;
  const total = trip.totalSeats ?? 0;
  const occupied = total - available;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const getStatus = () => {
    if (available === 0)
      return { label: "Complet", color: "text-red-400", icon: AlertCircle };
    if (available <= 5)
      return {
        label: "Dernières places",
        color: "text-amber-400",
        icon: AlertCircle,
      };
    if (available <= total * 0.3)
      return {
        label: "Places limitées",
        color: "text-amber-400",
        icon: AlertCircle,
      };
    return {
      label: "Disponible",
      color: "text-emerald-400",
      icon: CheckCircle,
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <View
      className="rounded-3xl p-6 bg-white/5 border border-white/10"
    >
      <View className="flex items-center justify-between mb-3">
        <View className="flex items-center gap-2">
          <Users size={16} className="text-indigo-400" />
          <Text className="text-white font-bold text-base">Disponibilité</Text>
        </View>
        <View
          className={`flex items-center gap-1.5 text-sm font-medium ${status.color}`}
        >
          <StatusIcon size={14} />
          {status.label}
        </View>
      </View>

      <View className="space-y-3">
        <View className="flex items-center justify-between text-sm">
          <Text className="text-white/60">
            {available} places disponibles sur {total}
          </Text>
          <Text className="text-white/40">{occupancyRate}% occupé</Text>
        </View>

        {/* Barre de progression */}
        <View className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: `${occupancyRate}%` }}
          />
        </View>

        {available === 0 && (
          <Text className="text-red-400/70 text-xs mt-1"><Text>Ce voyage est complet.</Text></Text>
        )}
        {available > 0 && available <= 5 && (
          <Text className="text-amber-400/70 text-xs mt-1">
            <Text>Dépêchez-vous, il ne reste que</Text>{available} <Text>place</Text>{available > 1 ? "s" : ""} <Text>!</Text></Text>
        )}
      </View>
    </View>
  );
}
