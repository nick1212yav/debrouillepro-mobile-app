import { View, Text } from "react-native";
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

      <View className="absolute left-[45px] top-[165px] flex flex-col items-center">
        <View className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-ping" />
        <Text className="text-[9px] font-bold text-blue-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/5">
          Moi
        </Text>
      </View>

      <View
        className="absolute left-[130px] top-[100px] flex flex-col items-center z-10"
      >
        <View className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center ring-4 ring-violet-500/30">
          <Navigation size={10} className="text-white fill-white" />
        </View>
        <Text className="text-[9px] font-black text-violet-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/10">
          Live (54 km/h)
        </Text>
      </View>

      <View className="absolute left-[310px] top-[85px] flex flex-col items-center">
        <MapPin size={18} className="text-emerald-500 fill-emerald-500/10" />
        <Text className="text-[9px] font-bold text-emerald-400 mt-1 bg-black/80 px-1.5 py-0.5 rounded border border-white/5">
          {destination}
        </Text>
      </View>

      <View className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 border border-white/10 flex items-center gap-1.5 text-white/80">
        <Compass size={14} className="animate-spin-slow" />
        <Text className="text-[10px] font-bold"><Text>GPS Live</Text></Text>
      </View>
    </View>
  );
}
