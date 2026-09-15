import { View, Text } from "react-native";

// src/features/transport/dashboard/FuelConsumption.tsx
import { Gauge, Flame, Compass, CheckCircle2 } from "lucide-react-native";

export function FuelConsumption() {
  const stats = {
    fleetAverageL100: 8.4,
    monthlyFuelCostFcfa: 450000,
    ecoDrivingScorePercent: 94.2,
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 text-white"><View className="flex items-center gap-2"><Gauge size={16} className="text-violet-400" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Suivi Carburant & Éco-Conduite [2]
        </Text></View><View className="gap-4">{}<View className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-3"><View className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0"><Flame size={16} /></View><View><Text className="text-[10px] text-white/40 font-bold uppercase">Moyenne flotte
            </Text><Text className="text-sm font-black text-white">{stats.fleetAverageL100}L / 100km [2]
            </Text></View></View>{}<View className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-3"><View className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0"><Compass size={16} className="animate-spin-slow" /></View><View><Text className="text-[10px] text-white/40 font-bold uppercase">Budget Carburant
            </Text><Text className="text-sm font-black text-white">{stats.monthlyFuelCostFcfa.toLocaleString()}FCFA [2]
            </Text></View></View>{}<View className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-3"><View className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0"><CheckCircle2 size={16} /></View><View><Text className="text-[10px] text-white/40 font-bold uppercase">Score Éco-Conduite
            </Text><Text className="text-sm font-black text-emerald-400">{stats.ecoDrivingScorePercent}% [2]
            </Text></View></View></View></View>
  );
}
