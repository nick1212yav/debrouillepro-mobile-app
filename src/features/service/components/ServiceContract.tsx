import { Pressable, Text, View } from "react-native";
import { FileText, Download } from "lucide-react-native";

export function ServiceContract({
  contract,
}: {
  contract?: { id: string; url: string };
}) {
  if (!contract) return null;
  return (
    <View className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
      <Text className="text-white text-sm">Contrat #{contract.id}</Text>
      <Pressable
        className="text-white/40" accessibilityHint={contract.url}
      >
        <Download size={16} />
      </Pressable>
    </View>
  );
}
