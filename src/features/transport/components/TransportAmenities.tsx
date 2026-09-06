import { View, Text } from "react-native";
// src/features/transport/components/TransportAmenities.tsx
import {
  Wifi,
  Thermometer,
  BatteryCharging,
  Shield,
  Luggage,
} from "lucide-react-native";

interface TransportAmenitiesProps {
  amenities?: string[]; // ["wifi", "climatisation", "chargeur", "securite"]
}

const AMENITY_MAP: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  wifi: {
    label: "Wi-Fi Gratuit",
    icon: <Wifi size={12} />,
    color: "text-blue-400 bg-blue-500/5 border-blue-500/10",
  },
  climatisation: {
    label: "Climatisation active",
    icon: <Thermometer size={12} />,
    color: "text-violet-400 bg-violet-500/5 border-violet-500/10",
  },
  chargeur: {
    label: "Port USB / Chargeur",
    icon: <BatteryCharging size={12} />,
    color: "text-amber-400 bg-amber-500/5 border-amber-500/10",
  },
  securite: {
    label: "Sécurité d'urgence",
    icon: <Shield size={12} />,
    color: "text-red-400 bg-red-500/5 border-red-500/10",
  },
  bagages: {
    label: "Grand coffre bagages",
    icon: <Luggage size={12} />,
    color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10",
  },
};

export function TransportAmenities({
  amenities = ["wifi", "climatisation", "chargeur"],
}: TransportAmenitiesProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-3">
      <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
        Équipements à bord [2]
      </Text>
      <View className="flex flex-wrap gap-2 pt-1">
        {amenities.map((key) => {
          const config = AMENITY_MAP[key.toLowerCase()];
          if (!config) return null;

          return (
            <View
              key={key}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold ${config.color}`}
            >
              {config.icon}
              <Text>{config.label} <Text>[2]</Text></Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
