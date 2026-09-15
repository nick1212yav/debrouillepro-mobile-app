import { Text, View } from "react-native";

// src/features/voyages/components/detail/VoyageSafety.tsx
import {
  Shield,
  CheckCircle,
  Truck,
  User,
  MapPin,
  BadgeCheck,
} from "lucide-react-native";

interface VoyageSafetyProps {
  trip: any; // plus tard, on utilisera un type plus précis
}

export function VoyageSafety({ trip }: VoyageSafetyProps) {
  const safetyItems = [
    { icon: Shield, label: "Opérateur vérifié", active: true },
    { icon: Truck, label: "Véhicule inspecté", active: true },
    { icon: User, label: "Conducteur enregistré", active: true },
    { icon: MapPin, label: "Trajet enregistré", active: true },
    { icon: BadgeCheck, label: "Protection DébrouillePro", active: true },
  ];

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 bg-white/5 border border-white/10">
      <View className="flex items-center gap-2 mb-4">
        <Shield size={16} className="text-emerald-400" />
        <Text className="text-white font-bold text-base">Sécurité</Text>
      </View>

      <View className="gap-2">
        {safetyItems.map(({ icon: Icon, label, active }) => (
          <View key={label} className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
              active ? "text-white/80" : "text-white/30"
            }`} style={{ backgroundColor: active
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(255,255,255,0.05)" }}>
            <Icon
              size={14}
              className={active ? "text-emerald-400" : "text-white/20"}
            />
            <Text>{label}</Text>
            {active && (
              <CheckCircle size={12} className="text-emerald-400 ml-auto" />
            )}
          </View>
        ))}
      </View>

      <Text className="text-white/30 text-xs mt-3 italic">
        Tous les trajets sont sécurisés et suivis par DébrouillePro.
      </Text>
    </View>
  );
}
