import { View, Pressable, Text } from "react-native";

interface FilePreviewProps {
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  href?: string;
}

function formatFileSize(bytes?: number) {
  if (bytes === undefined || bytes < 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({
  fileName,
  fileSize,
  mimeType,
  href,
}: FilePreviewProps) {
  const content = (
    <>
      <View className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
        📄
      </View>

      <View className="min-w-0">
        <Text className="truncate text-sm font-medium text-white">{fileName}</Text>

        <Text className="text-xs text-white/50">
          {mimeType || "Fichier"}
          {fileSize !== undefined && ` · ${formatFileSize(fileSize)}`}
        </Text>
      </View>
    </>
  );

  if (href) {
    return (
      <Pressable className="flex max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3" accessibilityHint={href}>
        {content}
      </Pressable>
    );
  }

  return (
    <View className="flex max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
      {content}
    </View>
  );
}

export default FilePreview;
