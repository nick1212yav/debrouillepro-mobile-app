import { View, Text } from "react-native";
import { TrendingUp, Users, Clock, Eye } from "lucide-react-native";

interface Props {
  views: number;
  uniqueViewers: number;
  averageReadTime: number; // en secondes
  growth: number; // pourcentage
}

export function CommunityAnalytics({
  views,
  uniqueViewers,
  averageReadTime,
  growth,
}: Props) {
  return (
    <View className="space-y-3"><Text className="text-sm font-medium text-white/50">Analytiques</Text><View className="gap-2"><View className="p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center gap-2"><Eye size={14} className="text-white/30" /><Text className="text-white/40 text-xs">Vues totales</Text></View><Text className="text-white font-bold text-lg mt-1">{views}</Text></View><View className="p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center gap-2"><Users size={14} className="text-white/30" /><Text className="text-white/40 text-xs">Visiteurs uniques</Text></View><Text className="text-white font-bold text-lg mt-1">{uniqueViewers}</Text></View><View className="p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center gap-2"><Clock size={14} className="text-white/30" /><Text className="text-white/40 text-xs">Temps de lecture</Text></View><Text className="text-white font-bold text-lg mt-1">{Math.floor(averageReadTime / 60)}min{" "}{Math.floor(averageReadTime % 60)}s
          </Text></View><View className="p-3 rounded-xl bg-white/5 border border-white/5"><View className="flex items-center gap-2"><TrendingUp size={14} className={`${growth >= 0 ? "text-green-400" : "text-red-400"}`} /><Text className="text-white/40 text-xs">Croissance</Text></View><Text className={`font-bold text-lg mt-1 ${growth >= 0 ? "text-green-400" : "text-red-400"}`}>{growth >= 0 ? "+" : ""}{growth}%
          </Text></View></View></View>
  );
}
