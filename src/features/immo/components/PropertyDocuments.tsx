import { View, Text } from "react-native";
import { FileText, Download, Eye } from "lucide-react-native";

interface Props {
  documents?: Array<{
    id: string;
    title: string;
    url: string;
    type:
      | "title"
      | "contract"
      | "plan"
      | "diagnostic"
      | "certificate"
      | "receipt";
    size: number;
  }>;
}

export function PropertyDocuments({ documents = [] }: Props) {
  if (documents.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View className="bg-white/5 rounded-2xl p-4">
      <Text className="text-sm font-medium text-white/70 mb-2">Documents</Text>
      <View className="space-y-2">
        {documents.map((doc) => (
          <View
            key={doc.id}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5"
          >
            <FileText size={16} className="text-white/30" />
            <Text className="text-xs text-white/60 flex-1">{doc.title}</Text>
            <Text className="text-[10px] text-white/30">
              {formatSize(doc.size)}
            </Text>
            <Pressable
              download
              className="text-white/40" accessibilityHint={doc.url}
            >
              <Download size={14} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
