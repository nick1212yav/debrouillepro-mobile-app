import { View, Text } from "react-native";
import React from "react";
import { MessageCircle, Clock } from "lucide-react-native";

interface HostResponseRateProps {
  responseRate?: number;
  responseTimeLabel?: string;
  className?: string;
}

export const HostResponseRate: React.FC<HostResponseRateProps> = ({
  responseRate = 98,
  responseTimeLabel = "Moins d'une heure",
  className = "",
}) => {
  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-2 gap-4 ${className}`}><View className="flex items-center gap-3"><View className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><MessageCircle size={18} /></View><View className="flex flex-col gap-0.5"><Text className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Taux de réponse
          </Text><Text className="text-sm font-black text-white">{responseRate}%</Text></View></View><View className="flex items-center gap-3 border-l border-white/5 pl-4"><View className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0"><Clock size={18} /></View><View className="flex flex-col gap-0.5"><Text className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Délai moyen
          </Text><Text className="text-xs font-extrabold text-white">{responseTimeLabel}</Text></View></View></View>
  );
};
