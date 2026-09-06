import { View, Text } from "react-native";

// src/features/transport/dashboard/AnalyticsCharts.tsx
import { Cpu, Sparkles } from "lucide-react-native";

export function AnalyticsCharts() {
  const peakForecastHours = [
    { hour: "08:00", value: 95, color: "bg-red-500/50" }, // Pic d'affluence matinale [2]
    { hour: "10:00", value: 45, color: "bg-violet-500/30" },
    { hour: "12:00", value: 65, color: "bg-violet-500/30" },
    { hour: "14:00", value: 50, color: "bg-violet-500/30" },
    { hour: "18:00", value: 90, color: "bg-red-500/50" }, // Pic d'affluence soirée [2]
    { hour: "20:00", value: 30, color: "bg-violet-500/30" },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 text-white">
      <View className="flex items-center gap-2">
        <Cpu size={16} className="text-violet-400 animate-pulse" />
        <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1">
          Prédiction Affluence IA (Débrouille AI) [2]
          <Sparkles size={11} className="text-violet-400" />
        </Text>
      </View>

      <View className="space-y-3">
        <Text className="text-xs text-white/50 leading-relaxed">
          Modèle d'analyse prédictive estimant le taux de congestion moyen de la
          voirie urbaine par tranche horaire pour l'optimisation des courses
          [2].
        </Text>

        {/* Graphique à barres SVG/HTML */}
        <View className="flex items-end justify-between h-36 pt-4 px-2 border-b border-white/5 relative">
          {peakForecastHours.map((h, i) => (
            <View key={i} className="flex flex-col items-center gap-2 flex-1">
              <View
                className={`w-8 rounded-t-lg ${h.color} relative overflow-hidden`}
                style={{ height: `${h.value}px` }}
              >
                {/* Lueur d'activité sur les pics d'affluence */}
                {h.value >= 90 && (
                  <View className="absolute inset-0 bg-gradient-to-t from-transparent to-red-500/20 animate-pulse" />
                )}
              </View>
              <Text className="text-[9px] font-mono text-white/40">
                {h.hour}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
