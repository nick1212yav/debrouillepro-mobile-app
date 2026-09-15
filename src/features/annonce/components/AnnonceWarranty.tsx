import { View, Text } from "react-native";
import { Shield, CheckCircle } from "lucide-react-native";

interface Props {
  months?: number;
  description?: string;
  isTransferable?: boolean;
}

export function AnnonceWarranty({
  months,
  description,
  isTransferable = false,
}: Props) {
  if (!months && !description) return null;

  return (
    <View className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"><View className="flex items-start gap-3"><Shield size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" /><View><Text className="text-sm font-medium text-white/80">Garantie incluse</Text>{months && (
            <Text className="text-xs text-white/50">{months} mois de garantie</Text>
          )}{description && (
            <Text className="text-xs text-white/40 mt-1">{description}</Text>
          )}{isTransferable && (
            <View className="flex items-center gap-1 mt-1">
              <CheckCircle size={10} className="text-emerald-400" />
              <Text className="text-xs text-emerald-400/60">
                Garantie transférable
              </Text>
            </View>
          )}</View></View></View>
  );
}
