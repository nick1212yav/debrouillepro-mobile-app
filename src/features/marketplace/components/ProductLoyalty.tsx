import { View, Text } from "react-native";
// src/features/marketplace/components/ProductLoyalty.tsx
import { Star, Zap } from "lucide-react-native";

interface Props {
  points: number;
  level?: "bronze" | "silver" | "gold" | "platinum";
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

export function ProductLoyalty({ points, level = "bronze" }: Props) {
  return (
    <View
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ backgroundColor: "rgba(255,215,0,0.08)", borderWidth: 1, borderColor: "rgba(255,215,0,0.15)", borderStyle: "solid" }}
    >
      <Star size={18} style={{ color: LEVEL_COLORS[level] }} />
      <View className="flex-1">
        <Text className="text-white font-medium text-sm">
          <Text>Fidélité</Text>{LEVEL_LABELS[level]}
        </Text>
        <Text className="text-white/40 text-xs">{points} <Text>points gagnés</Text></Text>
      </View>
      <Zap size={14} className="text-amber-400" />
    </View>
  );
}
