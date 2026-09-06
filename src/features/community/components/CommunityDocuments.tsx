import { View, Text } from "react-native";
import {
  FileText,
  Download,
  ExternalLink,
  File,
  FileCheck,
} from "lucide-react-native";

interface Document {
  id: string;
  name: string;
  url: string;
  type: "pdf" | "doc" | "xls" | "ppt" | "txt" | "other";
  size?: string;
  uploadedAt: number;
}

interface Props {
  documents: Document[];
  onDownload?: (doc: Document) => void;
}

const DOCUMENT_ICONS = {
  pdf: FileText,
  doc: FileText,
  xls: FileText,
  ppt: FileText,
  txt: FileText,
  other: File,
};

export function CommunityDocuments({ documents, onDownload }: Props) {
  if (!documents || documents.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Documents</Text>
      <View className="space-y-1.5">
        {documents.map((doc) => {
          const Icon = DOCUMENT_ICONS[doc.type] || File;
          return (
            <View
              key={doc.id}
              className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5"
            >
              <Icon size={16} className="text-white/30 flex-shrink-0" />
              <View className="flex-1 min-w-0">
                <Text className="text-white/70 text-sm truncate">{doc.name}</Text>
                <View className="flex items-center gap-2 text-white/20 text-[10px]">
                  <Text>{doc.type.toUpperCase()}</Text>
                  {doc.size && <Text><Text>·</Text>{doc.size}</Text>}
                  <Text><Text>·</Text>{new Date(doc.uploadedAt).toLocaleDateString()}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => onDownload?.(doc)}
                className="p-1.5 rounded-lg text-white/30"
              >
                <Download size={14} />
              </Pressable>
              <Pressable
                className="p-1.5 rounded-lg text-white/30" accessibilityHint={doc.url}
              >
                <ExternalLink size={14} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
