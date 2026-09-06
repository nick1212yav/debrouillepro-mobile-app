import { Pressable, Text, View, Image } from "react-native";

interface AttachmentPreviewProps {
  file: File;
  previewUrl?: string;
  onRemove?: () => void;
}

export function AttachmentPreview({
  file,
  previewUrl,
  onRemove,
}: AttachmentPreviewProps) {
  const isImage = file.type.startsWith("image/");

  return (
    <View className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {isImage && previewUrl ? (
        <Image
          className="h-24 w-24 object-cover" source={{ uri: previewUrl }} accessibilityLabel={file.name}
        />
      ) : (
        <View className="flex h-24 w-24 flex-col items-center justify-center gap-1 p-2 text-center">
          <Text className="text-2xl">📄</Text>

          <Text className="w-full truncate text-[10px] text-white/70">
            {file.name}
          </Text>
        </View>
      )}

      {onRemove && (
        <Pressable
          onPress={onRemove}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
          accessibilityLabel={`Supprimer ${file.name}`}
        >
          ×
        </Pressable>
      )}
    </View>
  );
}

export default AttachmentPreview;
