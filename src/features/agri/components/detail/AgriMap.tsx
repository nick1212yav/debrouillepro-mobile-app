import { View, Text } from "react-native";

// src/features/agri/components/detail/AgriMap.tsx
import { Map, MapPin } from "lucide-react-native";

interface AgriMapProps {
  location: {
    city: string;
    coordinates?: { lat: number; lng: number };
  };
}

export function AgriMap({ location }: AgriMapProps) {
  return (
    <View className="rounded-[24px] overflow-hidden bg-white/[0.02] border border-white/5 p-1 animate-fadeIn"><View className="relative aspect-[16/9] w-full rounded-[20px] overflow-hidden bg-black/30 flex items-center justify-center">{}<View className="absolute inset-0 bg-white/[0.02] bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" /><View className="flex flex-col items-center gap-2.5 z-10 text-center p-4"><View className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 flex items-center justify-center animate-bounce"><MapPin size={18} /></View><View><Text className="text-white text-xs font-bold leading-none">{location.city}</Text><Text className="text-white/40 text-[9px] mt-1">Coordonnées géographiques vérifiées
            </Text></View></View><View className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-black/50 backdrop-blur-md text-[9px] font-semibold text-white/60 border border-white/5 flex items-center gap-1.5"><Map size={10} /><Text>Localisation</Text></View></View></View>
  );
}
