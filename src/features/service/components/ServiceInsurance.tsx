import { View } from "react-native";

export function ServiceInsurance({
  hasInsurance,
  provider,
}: {
  hasInsurance: boolean;
  provider?: string;
}) {
  if (!hasInsurance) return null;
  return (
    <View className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
      🛡️ Ce prestataire est assuré{provider ? ` par ${provider}` : ""}
    </View>
  );
}
