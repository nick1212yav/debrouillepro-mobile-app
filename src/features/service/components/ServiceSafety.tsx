import { Text, View } from "react-native";
import { Shield, CheckCircle } from "lucide-react-native";

export function ServiceSafety({
  isVerified,
  hasInsurance,
  hasWarranty,
}: {
  isVerified: boolean;
  hasInsurance: boolean;
  hasWarranty: boolean;
}) {
  return (
    <View className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-wrap gap-4">
      {isVerified && (
        <Text className="flex items-center gap-1 text-emerald-400 text-xs">
          <Shield size={14} /> Identité vérifiée
        </Text>
      )}
      {hasInsurance && (
        <Text className="flex items-center gap-1 text-amber-400 text-xs">
          🛡️ Assurance
        </Text>
      )}
      {hasWarranty && (
        <Text className="flex items-center gap-1 text-purple-400 text-xs">
          ✅ Garantie
        </Text>
      )}
    </View>
  );
}
