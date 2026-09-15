import { View, Text } from "react-native";

// src/features/marketplace/components/RewardPoints.tsx
import { Star, Zap } from "lucide-react-native";

interface Props {
  points: number;
  level: "bronze" | "silver" | "gold" | "platinum";
  nextLevelPoints?: number;
}

const LEVEL_COLORS = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

const LEVEL_LABELS = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platinum: "Platine",
};

export function RewardPoints({ points, level, nextLevelPoints }: Props) {
  const color = LEVEL_COLORS[level];
  const progress = nextLevelPoints ? (points / nextLevelPoints) * 100 : 100;

  return (
    <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,215,0,0.08)", borderWidth: 1, borderColor: "rgba(255,215,0,0.12)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-3"><View className="flex items-center gap-2"><Star size={18} style={{ color }} /><Text className="text-white font-bold text-sm">{LEVEL_LABELS[level]}</Text></View><View className="flex items-center gap-1"><Zap size={14} className="text-amber-400" /><Text className="text-white font-bold text-lg">{points}</Text><Text className="text-white/30 text-xs">pts</Text></View></View>{nextLevelPoints && (
        <View className="space-y-1"><View className="flex justify-between text-[10px] text-white/40"><Text>{points}pts</Text><Text>{nextLevelPoints}pts</Text></View><View className="h-2 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }} /></View><Text className="text-[10px] text-white/30 text-right">{Math.round(progress)}% vers le niveau supérieur
          </Text></View>
      )}</View>
  );
}
