import { Text, View } from "react-native";
import { Shield, CheckCircle } from "lucide-react-native";

export function ServiceVerification({
  verified,
  insurance,
  warranty,
}: {
  verified: boolean;
  insurance: boolean;
  warranty: boolean;
}) {
  return (
    <View className="flex flex-wrap gap-2">
      {verified && (
        <Text className="flex items-center gap-1 text-green-400 text-xs">
          <CheckCircle size={14} /> Vérifié
        </Text>
      )}
      {insurance && (
        <Text className="flex items-center gap-1 text-amber-400 text-xs">
          🛡️ Assuré
        </Text>
      )}
      {warranty && (
        <Text className="flex items-center gap-1 text-purple-400 text-xs">
          ✅ Garantie
        </Text>
      )}
    </View>
  );
}
