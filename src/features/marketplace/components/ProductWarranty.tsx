import { View, Text } from "react-native";
// src/features/marketplace/components/ProductWarranty.tsx
import { Shield } from "lucide-react-native";

interface Props {
  months: number;
  coverage?: string[];
}

export function ProductWarranty({ months, coverage }: Props) {
  return (
    <View
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{ backgroundColor: "rgba(16,185,129,0.06)", borderWidth: 1, borderColor: "rgba(16,185,129,0.12)", borderStyle: "solid" }}
    >
      <Shield size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
      <View>
        <Text className="text-white font-medium text-sm"><Text>Garantie</Text>{months} <Text>mois</Text></Text>
        {coverage && coverage.length > 0 && (
          <View className="flex flex-wrap gap-1 mt-1">
            {coverage.map((item) => (
              <Text
                key={item}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50"
              >
                {item}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
