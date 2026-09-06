import { Pressable, Text, View } from "react-native";
import { FileText, Download } from "lucide-react-native";

export function ServiceDocuments({
  docs,
}: {
  docs?: { name: string; url: string }[];
}) {
  if (!docs || docs.length === 0) return null;
  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Documents</Text>
      {docs.map((d) => (
        <View
          key={d.name}
          className="flex items-center gap-2 p-2 rounded-xl bg-white/5"
        >
          <FileText size={14} className="text-white/30" />
          <Text className="text-white/70 text-sm flex-1">{d.name}</Text>
          <Pressable
            className="text-white/40" accessibilityHint={d.url}
          >
            <Download size={14} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
