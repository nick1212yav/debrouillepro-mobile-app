import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Navigation, Compass, MapPin } from "lucide-react-native";

interface TransportLiveMapProps {
  origin: string;
  destination: string;
}

export function TransportLiveMap({
  origin,
  destination,
}: TransportLiveMapProps) {
  return (
    <View className="relative h-64 w-full rounded-3xl overflow-hidden border border-white/5 bg-[#070a1a]">
      <View className="absolute inset-0 opacity-25 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 220"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Path
          d="M 40,170 Q 160,40 310,95"
          fill="none"
          stroke="rgba(139, 92, 246, 0.25)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <Path
          d="M 40,170 Q 160,40 310,95"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </Svg>
      <View className="absolute left-[36px] top-[150px] flex flex-col items-center">
        <View className="w-3 h-3 rounded-full bg-blue-500" />
        <Text className="text-[9px] font-bold text-blue-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/5">
          {origin || "Départ"}
        </Text>
      </View>
      <View className="absolute left-[130px] top-[90px] flex flex-col items-center z-10">
        <View className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
          <Navigation size={10} color="#FFFFFF" />
        </View>
        <Text className="text-[9px] font-black text-violet-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
          En route
        </Text>
      </View>
      <View className="absolute right-6 top-[78px] flex flex-col items-center">
        <MapPin size={18} color="#10B981" />
        <Text className="text-[9px] font-bold text-emerald-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/5">
          {destination}
        </Text>
      </View>
      <View className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 border border-white/10 flex items-center gap-1.5">
        <Compass size={14} color="rgba(255,255,255,0.8)" />
        <Text className="text-[10px] font-bold text-white/80">GPS Live</Text>
      </View>
    </View>
  );
}
