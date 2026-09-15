import { View, Text } from "react-native";

export function ServiceNearby({ providers }: { providers: any[] }) {
  if (!providers || providers.length === 0) return null;
  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">
        Prestataires à proximité
      </Text>
      {providers.map((p) => (
        <View key={p._id} className="p-2 rounded-xl bg-white/5 text-white/70 text-sm">
          {p.name}
        </View>
      ))}
    </View>
  );
}
