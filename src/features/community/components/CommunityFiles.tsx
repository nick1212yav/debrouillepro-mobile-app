import { View, Text } from "react-native";
import {
  File,
  Download,
  ExternalLink,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
} from "lucide-react-native";

interface FileItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "audio" | "pdf" | "archive" | "other";
  size?: string;
}

interface Props {
  files: FileItem[];
  onDownload?: (file: FileItem) => void;
}

const FILE_ICONS = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  archive: FileArchive,
  other: File,
};

export function CommunityFiles({ files, onDownload }: Props) {
  if (!files || files.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Fichiers</Text>
      <View className="space-y-1.5">
        {files.map((file) => {
          const Icon = FILE_ICONS[file.type] || File;
          return (
            <View
              key={file.id}
              className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5"
            >
              <Icon size={16} className="text-white/30 flex-shrink-0" />
              <View className="flex-1 min-w-0">
                <Text className="text-white/70 text-sm truncate">{file.name}</Text>
                {file.size && (
                  <Text className="text-white/20 text-[10px]">{file.size}</Text>
                )}
              </View>
              <Pressable
                onPress={() => onDownload?.(file)}
                className="p-1.5 rounded-lg text-white/30"
              >
                <Download size={14} />
              </Pressable>
              <Pressable
                className="p-1.5 rounded-lg text-white/30" accessibilityHint={file.url}
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
