import { View, Text } from "react-native";
import { CheckCircle } from "lucide-react-native";

export function ServiceReceipt({
  receipt,
}: {
  receipt?: { id: string; amount: string; date: string };
}) {
  if (!receipt) return null;
  return (
    <View className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
      <CheckCircle size={20} className="text-emerald-400" />
      <View>
        <Text className="text-white text-sm"><Text>Paiement confirmé</Text></Text>
        <Text className="text-white/40 text-xs">
          <Text>#</Text>{receipt.id} <Text>·</Text>{receipt.date} <Text>·</Text>{receipt.amount}
        </Text>
      </View>
    </View>
  );
}
