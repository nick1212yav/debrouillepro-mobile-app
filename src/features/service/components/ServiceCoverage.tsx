import { View, Text } from "react-native";
import { MapPin } from "lucide-react-native";

export function ServiceCoverage({ area }: { area?: string[] }) {
  if (!area || area.length === 0) return null;
  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Zone d'intervention</Text>
      <View className="flex flex-wrap gap-2">
        {area.map((a) => (
          <Text
            key={a}
            className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/70"
          >
            <MapPin size={10} className="inline mr-1" />
            {a}
          </Text>
        ))}
      </View>
    </View>
  );
}
