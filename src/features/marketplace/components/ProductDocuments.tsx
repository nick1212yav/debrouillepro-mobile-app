import { Text, Pressable, View } from "react-native";

// src/features/marketplace/components/ProductDocuments.tsx
import { FileText, Download } from "lucide-react-native";

interface Document {
  id: string;
  title: string;
  url: string;
  type: "pdf" | "image" | "other";
}

interface Props {
  documents: Document[];
}

export function ProductDocuments({ documents }: Props) {
  if (!documents || documents.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Documents
      </Text>
      {documents.map((doc) => (
        <Pressable
          key={doc.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/5" accessibilityHint={doc.url}
        >
          <FileText size={16} className="text-purple-400" />
          <Text className="flex-1 text-white/80 text-sm">{doc.title}</Text>
          <Download size={14} className="text-white/30" />
        </Pressable>
      ))}
    </View>
  );
}
