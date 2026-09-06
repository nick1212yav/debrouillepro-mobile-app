import { Text, View } from "react-native";
import type { AnnonceCondition } from "../types";

interface Props {
  condition: AnnonceCondition;
}

const CONDITION_LABELS: Record<
  AnnonceCondition,
  { label: string; color: string }
> = {
  neuf: { label: "Neuf", color: "#10B981" },
  "comme-neuf": { label: "Comme neuf", color: "#34D399" },
  "tres-bon": { label: "Très bon état", color: "#60A5FA" },
  bon: { label: "Bon état", color: "#FBBF24" },
  acceptable: { label: "État acceptable", color: "#F59E0B" },
  "a-renover": { label: "À rénover", color: "#EF4444" },
};

export function AnnonceCondition({ condition }: Props) {
  const info = CONDITION_LABELS[condition];
  if (!info) return null;

  return (
    <View className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
      <Text
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: info.color }}
      />
      <Text className="text-xs text-white/80 font-medium">{info.label}</Text>
    </View>
  );
}
