import { Pressable, View, Text } from "react-native";
import { FileText, Download } from "lucide-react-native";

export function ServiceInvoice({
  invoice,
}: {
  invoice?: { id: string; amount: string; date: string; url: string };
}) {
  if (!invoice) return null;
  return (
    <View className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
      <View>
        <Text className="text-white text-sm">Facture #{invoice.id}</Text>
        <Text className="text-white/40 text-xs">{invoice.date}</Text>
      </View>
      <View className="flex items-center gap-3">
        <Text className="text-white font-bold">{invoice.amount}</Text>
        <Pressable
          className="text-white/40" accessibilityHint={invoice.url}
        >
          <Download size={16} />
        </Pressable>
      </View>
    </View>
  );
}
