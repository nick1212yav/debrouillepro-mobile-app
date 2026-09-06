import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorLabResults.tsx
import {
  TestTube,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react-native";

export interface LabResult {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  date: Date;
  status: "normal" | "high" | "low" | "critical";
}

interface DoctorLabResultsProps {
  results: LabResult[];
  onResultClick?: (result: LabResult) => void;
}

export function DoctorLabResults({
  results,
  onResultClick,
}: DoctorLabResultsProps) {
  if (!results || results.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <TestTube size={14} /> Résultats d'analyses
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">Aucun résultat</Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <TestTube size={14} /> Résultats d'analyses ({results.length})
      </Text>
      <View
        className="space-y-2 max-h-60 overflow-y-auto"
        style={{  }}
      >
        {results.map((r) => {
          const isNormal = r.status === "normal";
          const isHigh = r.status === "high";
          const isLow = r.status === "low";
          const isCritical = r.status === "critical";

          const statusColor = isNormal
            ? "text-green-400"
            : isCritical
              ? "text-red-400"
              : isHigh
                ? "text-orange-400"
                : isLow
                  ? "text-blue-400"
                  : "text-white/40";

          return (
            <Pressable
              key={r.id}
              onPress={() => onResultClick?.(r)}
              className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10"
            >
              <View className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <TestTube size={14} className="text-purple-400" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white text-sm font-medium truncate">
                  {r.name}
                </Text>
                <Text className="text-white/40 text-xs flex items-center gap-1">
                  <Calendar size={10} />
                  {r.date.toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <View className="text-right flex-shrink-0">
                <Text className={`text-sm font-bold ${statusColor}`}>
                  {r.value} {r.unit}
                </Text>
                {r.referenceMin !== undefined &&
                  r.referenceMax !== undefined && (
                    <Text className="text-[10px] text-white/30">
                      <Text>Réf:</Text>{r.referenceMin} <Text>-</Text>{r.referenceMax} {r.unit}
                    </Text>
                  )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
