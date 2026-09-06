import { View, Text } from "react-native";
// src/features/transport/dashboard/RevenueDashboard.tsx
import {
  BarChart3,
  TrendingUp,
  Coins,
  Percent,
  ArrowUpRight,
} from "lucide-react-native";
import { formatMobilityPrice } from "../utils/distance";

export function RevenueDashboard() {
  const stats = {
    gross: 2450000,
    commission: 294000, // 12% commission plateforme [2]
    net: 2156000,
    averageTicket: 3200,
    growthPercent: 14.5,
  };

  const categories = [
    { label: "Covoiturage", amount: 980000, color: "bg-violet-500" },
    { label: "Taxi individuel", amount: 750000, color: "bg-blue-400" },
    { label: "Bus / Minibus", amount: 520000, color: "bg-indigo-400" },
    { label: "Fret / Camion", amount: 200000, color: "bg-amber-400" },
  ];

  return (
    <View className="space-y-6 text-white">
      {/* Grille analytique */}
      <View className="gap-4">
        {/* CA Brut */}
        <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between shadow-lg">
          <View className="space-y-1">
            <Text className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
              Volume d'Affaires Brut [2]
            </Text>
            <Text className="text-xl font-black">
              {formatMobilityPrice(stats.gross, "FCFA")}
            </Text>
            <Text className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +{stats.growthPercent}% ce mois-ci
            </Text>
          </View>
          <View className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400">
            <Coins size={18} />
          </View>
        </View>

        {/* Commissions */}
        <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between shadow-lg">
          <View className="space-y-1">
            <Text className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
              Commissions perçues (12%) [2]
            </Text>
            <Text className="text-xl font-black text-violet-400">
              {formatMobilityPrice(stats.commission, "FCFA")}
            </Text>
            <Text className="text-[10px] text-white/30">
              Frais de service plateforme
            </Text>
          </View>
          <View className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400">
            <Percent size={18} />
          </View>
        </View>

        {/* CA Net Chauffeurs */}
        <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between shadow-lg">
          <View className="space-y-1">
            <Text className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
              Rémunération Chauffeurs (Net) [2]
            </Text>
            <Text className="text-xl font-black text-emerald-400">
              {formatMobilityPrice(stats.net, "FCFA")}
            </Text>
            <Text className="text-[10px] text-emerald-400/70 font-semibold">
              Fonds reversés sur Mobile Money [2]
            </Text>
          </View>
          <View className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400">
            <TrendingUp size={18} />
          </View>
        </View>
      </View>

      {/* Répartition par catégorie */}
      <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
        <View className="flex items-center gap-2">
          <BarChart3 size={16} className="text-violet-400" />
          <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
            Répartition des revenus [2]
          </Text>
        </View>

        <View className="space-y-3">
          {categories.map((cat, i) => {
            const percent = ((cat.amount / stats.gross) * 100).toFixed(1);
            return (
              <View key={i} className="space-y-1 text-xs">
                <View className="flex justify-between items-center text-white/60">
                  <Text className="font-bold">{cat.label}</Text>
                  <Text className="font-mono">
                    {formatMobilityPrice(cat.amount, "FCFA")} ({percent}%)
                  </Text>
                </View>
                <View className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <View
                    className={`h-full ${cat.color} rounded-full`}
                    style={{ width: `${percent}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
