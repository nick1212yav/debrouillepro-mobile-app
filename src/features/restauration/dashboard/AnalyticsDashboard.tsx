import { View, Text } from "react-native";
import { BarChart2, Star, TrendingUp, Users } from "lucide-react-native";
import type { BCGItemResult } from "../types/analytics.types";

interface AnalyticsDashboardProps {
  bcgMatrix: BCGItemResult[];
  conversionRate: number;
  averageBasket: number;
}

export function AnalyticsDashboard({
  bcgMatrix,
  conversionRate,
  averageBasket,
}: AnalyticsDashboardProps) {
  return (
    <View className="space-y-6 text-left animate-fade-in">{}<View className="gap-4"><View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex items-center gap-4"><View className="w-10 h-10 rounded-xl bg-orange-500/5 border border-orange-500/15 flex items-center justify-center text-orange-400 shrink-0"><TrendingUp size={16} /></View><View><Text className="block text-[8px] text-white/30 uppercase font-black">Taux de conversion
            </Text><Text className="text-base font-black text-white">{conversionRate.toFixed(1)}%
            </Text><Text className="block text-[10px] text-white/40 mt-0.5">Visiteurs transformés en acheteurs
            </Text></View></View><View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] flex items-center gap-4"><View className="w-10 h-10 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0"><Users size={16} /></View><View><Text className="block text-[8px] text-white/30 uppercase font-black">Panier Moyen
            </Text><Text className="text-base font-black text-white">{averageBasket.toLocaleString()}FCFA
            </Text><Text className="block text-[10px] text-white/40 mt-0.5">Dépense moyenne par commande
            </Text></View></View></View>{}<View className="space-y-3"><View className="flex items-center gap-2 px-1 text-white/40"><BarChart2 size={15} /><Text className="text-xs font-bold uppercase tracking-wider">Performance de la Carte (Matrice BCG)
          </Text></View><View className="space-y-2.5">{bcgMatrix.map((item) => {
            const variant = {
              STAR: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              PLOWHORSE: "bg-amber-500/10 border-amber-400/20 text-amber-400",
              PUZZLE: "bg-purple-500/10 border-purple-500/20 text-purple-400",
              DOG: "bg-rose-500/10 border-rose-500/20 text-rose-400",
            }[item.classification];

            return (
              <View key={item.name} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-4"><View><Text className="block font-bold text-xs text-white">{item.name}</Text><Text className="block text-[9px] text-white/45 mt-1 font-medium">{item.actionRequired}</Text></View><Text className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border shrink-0 ${variant}`}>{item.classification}</Text></View>
            );
          })}</View></View></View>
  );
}
