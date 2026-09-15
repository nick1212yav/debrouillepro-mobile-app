import { View, Text } from "react-native";

// src/features/marketplace/components/DeliveryTrackingMap.tsx
import { MapPin, Navigation } from "lucide-react-native";

interface Props {
  currentLocation: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  status: string;
  estimatedArrival: string;
}

export function DeliveryTrackingMap({
  currentLocation,
  destination,
  status,
  estimatedArrival,
}: Props) {
  return (
    <View className="space-y-3"><View className="relative rounded-2xl h-48 overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{}<View className="absolute inset-0 opacity-10">{Array.from({ length: 6 }).map((_, i) => (
            <View key={`v${i}`} className="absolute border-white/20" style={{
                left: `${i * 20}%`,
                top: 0,
                bottom: 0,
                borderLeftWidth: 1,
              }} />
          ))}{Array.from({ length: 5 }).map((_, i) => (
            <View key={`h${i}`} className="absolute border-white/20" style={{
                top: `${i * 25}%`,
                left: 0,
                right: 0,
                borderTopWidth: 1,
              }} />
          ))}</View>{}<View className="absolute inset-0 flex items-center justify-center"><View className="relative"><View className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center"><Navigation size={20} className="text-purple-400 animate-pulse" /><Text className="text-[10px] text-white/60 bg-black/50 px-2 py-0.5 rounded mt-1">{status}</Text></View><View className="w-6 h-6 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" /><View className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/40"><Text>Arrivée estimée:</Text>{estimatedArrival}</View></View></View></View><View className="flex items-center justify-between text-xs text-white/40"><Text className="flex items-center gap-1"><MapPin size={12} />Colis en transit
        </Text><Text>📍 {destination.lat}, {destination.lng}</Text></View></View>
  );
}
