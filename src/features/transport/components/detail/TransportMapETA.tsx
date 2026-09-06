import { View, Text } from "react-native";

// src/features/transport/components/detail/TransportMapETA.tsx
import { Navigation, Compass, MapPin, Gauge, TrafficCone } from "lucide-react-native";

interface TransportMapETAProps {
  origin: string;
  destination: string;
}

export function TransportMapETA({ origin, destination }: TransportMapETAProps) {
  return (
    <View className="space-y-4">
      {/* 🗺️ Carte Interactive Stylisée */}
      <View className="relative h-64 w-full rounded-3xl overflow-hidden border border-white/5 bg-[#070a1a]">
        {/* Grille de fond vectorielle simulant un GPS premium */}
        <View className="absolute inset-0 opacity-25 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Dessin de la route (SVG animé) */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 50,180 Q 150,50 320,100"
            fill="none"
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <motion.path
            d="M 50,180 Q 150,50 320,100"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="10 200"
          />
        </svg>

        {/* Marqueur Utilisateur */}
        <View className="absolute left-[45px] top-[165px] flex flex-col items-center">
          <View className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-ping" />
          <Text className="text-[9px] font-bold text-blue-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/5">
            Moi
          </Text>
        </View>

        {/* Marqueur Chauffeur (Mercedes) */}
        <View
          className="absolute left-[130px] top-[100px] flex flex-col items-center z-10"
        >
          <View className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center ring-4 ring-violet-500/30">
            <Navigation size={10} className="text-white fill-white" />
          </View>
          <Text className="text-[9px] font-black text-violet-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
            Chauffeur (54 km/h)
          </Text>
        </View>

        {/* Destination */}
        <View className="absolute left-[310px] top-[85px] flex flex-col items-center">
          <MapPin
            size={18}
            className="text-emerald-500 fill-emerald-500/10 drop-shadow"
          />
          <Text className="text-[9px] font-bold text-emerald-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/5">
            {destination}
          </Text>
        </View>

        {/* Badge Flottant Boussole */}
        <View className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 border border-white/10 flex items-center gap-1.5 text-white/80">
          <Compass size={14} className="animate-spin-slow" />
          <Text className="text-[10px] font-bold">Nord</Text>
        </View>
      </View>

      {/* ⏱️ Bloc ETA Premium */}
      <View className="gap-3">
        <View className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <Text className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
            Arrivée
          </Text>
          <Text className="text-lg font-black text-white mt-1">12 min</Text>
          <Text className="text-[9px] text-emerald-400 font-medium">
            À l'heure
          </Text>
        </View>
        <View className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <Text className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
            Distance
          </Text>
          <Text className="text-lg font-black text-white mt-1">5,3 km</Text>
          <Text className="text-[9px] text-white/40 font-medium">Restant</Text>
        </View>
        <View className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <Text className="text-[10px] font-bold text-white/30 uppercase tracking-wider">
            <Text>Trafic</Text></Text>
          <Text className="text-lg font-black text-amber-400 mt-1"><Text>Faible</Text></Text>
          <Text className="text-[9px] text-amber-400/80 font-medium">
            <Text>Voie fluide</Text></Text>
        </View>
      </View>
    </View>
  );
}
