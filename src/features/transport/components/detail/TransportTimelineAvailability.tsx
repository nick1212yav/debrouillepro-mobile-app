import { View, Text } from "react-native";
// src/features/transport/components/detail/TransportTimelineAvailability.tsx
import { CheckCircle2, Clock, MapPin, AlertCircle } from "lucide-react-native";

interface TimelineProps {
  origin: string;
  destination: string;
  departureTime: string;
}

export function TransportTimelineAvailability({
  origin,
  destination,
  departureTime,
}: TimelineProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.01] space-y-5">
      {/* Disponibilité globale */}
      <View className="flex items-center justify-between pb-3 border-b border-white/5">
        <View>
          <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
            Disponibilité
          </Text>
          <Text className="text-xs text-white/60 mt-0.5">
            2 places restantes sur 6 disponibles
          </Text>
        </View>
        <View className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
          <Text>98% de Ponctualité</Text></View>
      </View>

      {/* Chronologie de trajet dynamique */}
      <View className="space-y-4 relative pl-5">
        {/* Ligne verticale de liaison */}
        <View className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-violet-500 to-amber-500" />

        {/* Étape 1 : Départ */}
        <View className="relative">
          <View className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 flex items-center justify-center" />
          <View>
            <View className="flex items-center gap-1.5">
              <Text className="text-xs font-black text-white">{origin}</Text>
              <Text className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">
                Point initial
              </Text>
            </View>
            <Text className="text-[10px] text-white/40 mt-0.5">
              Enregistrement et embarquement - {departureTime}
            </Text>
          </View>
        </View>

        {/* Étape 2 : Checkpoint intermédiaire */}
        <View className="relative">
          <View className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-violet-500 ring-4 ring-violet-500/10" />
          <View>
            <View className="flex items-center gap-1.5">
              <Text className="text-xs font-bold text-white/80">
                Vérification de sécurité
              </Text>
            </View>
            <Text className="text-[10px] text-white/40 mt-0.5">
              Poste de contrôle technique & péage routier
            </Text>
          </View>
        </View>

        {/* Étape 3 : Arrivée */}
        <View className="relative">
          <View className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/10" />
          <View>
            <View className="flex items-center gap-1.5">
              <Text className="text-xs font-black text-white">{destination}</Text>
              <Text className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1 rounded">
                <Text>Terminus</Text></Text>
            </View>
            <Text className="text-[10px] text-white/40 mt-0.5">
              <Text>Débarquement gare centrale</Text></Text>
          </View>
        </View>
      </View>
    </View>
  );
}
