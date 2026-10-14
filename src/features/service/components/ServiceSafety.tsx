import { Text, View } from "react-native";
import { Shield, CheckCircle } from "lucide-react-native";

interface Props {
  isVerified: boolean;
  hasInsurance: boolean;
  hasWarranty: boolean;
}

export function ServiceSafety({
  isVerified,
  hasInsurance,
  hasWarranty,
}: Props) {
  const hasAny = isVerified || hasInsurance || hasWarranty;
  if (!hasAny) return null;

  return (
    <View className="flex-row flex-wrap gap-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
      {isVerified && (
        <View className="flex-row items-center gap-1.5">
          <Shield size={14} color="#34D399" />
          <Text className="text-xs text-emerald-400">Identité vérifiée</Text>
        </View>
      )}

      {hasInsurance && (
        <View className="flex-row items-center gap-1.5">
          <Shield size={14} color="#FBBF24" />
          <Text className="text-xs text-amber-400">Assurance</Text>
        </View>
      )}

      {hasWarranty && (
        <View className="flex-row items-center gap-1.5">
          <CheckCircle size={14} color="#C084FC" />
          <Text className="text-xs text-purple-400">Garantie</Text>
        </View>
      )}
    </View>
  );
}
