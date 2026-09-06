import { Pressable, View, Text } from "react-native";
// src/features/events/components/EventDocuments.tsx
import { FileText, Download } from "lucide-react-native";

interface Props {
  documents: Array<{ title: string; url: string }>;
}

export function EventDocuments({ documents }: Props) {
  if (!documents || documents.length === 0) return null;

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Documents
      </Text>
      <View className="space-y-2">
        {documents.map((doc, idx) => (
          <Pressable
            key={idx}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5" accessibilityHint={doc.url}
          >
            <FileText size={16} className="text-purple-400" />
            <Text className="text-white/80 text-sm flex-1">{doc.title}</Text>
            <Download size={14} className="text-white/30" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
