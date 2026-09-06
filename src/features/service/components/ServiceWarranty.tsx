import { View } from "react-native";

export function ServiceWarranty({
  hasWarranty,
  duration,
}: {
  hasWarranty: boolean;
  duration?: string;
}) {
  if (!hasWarranty) return null;
  return (
    <View className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
      ✅ Garantie{duration ? ` de ${duration}` : ""}
    </View>
  );
}
