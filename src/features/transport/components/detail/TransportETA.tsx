import { View, Text } from "react-native";
import { Clock, Navigation, ShieldCheck } from "lucide-react-native";

export function TransportETA() {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between"><View className="space-y-1"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Arrivée estimée
        </Text><Text className="text-3xl font-black text-white">12 min</Text><Text className="text-xs text-white/40">Distance : 5,3 km</Text></View><View className="text-right space-y-1"><Text className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">Trafic Faible
        </Text><Text className="text-[10px] text-white/40">Voie fluide</Text></View></View>
  );
}
