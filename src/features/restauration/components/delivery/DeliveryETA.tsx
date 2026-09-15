import { View, Text } from "react-native";
import { Clock, Navigation, Zap } from "lucide-react-native";

interface DeliveryETAProps {
  etaMinutes: number;
  distanceRemainingKm: number;
  speedKmh: number;
}

export function DeliveryETA({
  etaMinutes,
  distanceRemainingKm,
  speedKmh,
}: DeliveryETAProps) {
  return (
    <View className="gap-2 py-1"><View className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center"><Clock size={16} className="text-orange-400 mx-auto mb-1" /><Text className="block text-[8px] text-white/30 uppercase font-black">Temps restant
        </Text><Text className="text-sm font-black text-white mt-0.5 block">{etaMinutes}min
        </Text></View><View className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center"><Navigation size={16} className="text-sky-400 mx-auto mb-1" /><Text className="block text-[8px] text-white/30 uppercase font-black">Distance
        </Text><Text className="text-sm font-black text-white mt-0.5 block">{distanceRemainingKm.toFixed(1)}km
        </Text></View><View className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center"><Zap size={16} className="text-emerald-400 mx-auto mb-1" /><Text className="block text-[8px] text-white/30 uppercase font-black">Vitesse
        </Text><Text className="text-sm font-black text-white mt-0.5 block">{speedKmh}km/h
        </Text></View></View>
  );
}
