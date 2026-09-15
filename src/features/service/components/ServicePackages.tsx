import { Text, View } from "react-native";

export function ServicePackages({
  packages,
}: {
  packages?: { name: string; price: string; description: string }[];
}) {
  if (!packages || packages.length === 0) return null;
  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Formules</Text>
      {packages.map((p) => (
        <View key={p.name} className="p-3 rounded-xl bg-white/5 border border-white/5">
          <Text className="text-white font-semibold">{p.name}</Text>
          <Text className="text-orange-400">{p.price}</Text>
          <Text className="text-white/50 text-xs">{p.description}</Text>
        </View>
      ))}
    </View>
  );
}
