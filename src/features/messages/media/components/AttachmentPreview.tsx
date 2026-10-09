// src/features/messages/media/components/AttachmentPreview.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { NativePickedFile } from "./AttachmentPicker";

interface AttachmentPreviewProps {
  file: NativePickedFile;
  previewUrl?: string;
  onRemove?: () => void;
}

function getFileLabel(file: NativePickedFile): string {
  return (
    file.fileName?.trim() ||
    file.mimeType?.split("/")[1]?.toUpperCase() ||
    "Fichier"
  );
}

function getFileIcon(file: NativePickedFile): string {
  const mimeType = file.mimeType ?? "";

  if (mimeType.startsWith("video/")) {
    return "🎬";
  }

  if (mimeType.startsWith("audio/")) {
    return "🎵";
  }

  if (mimeType.includes("pdf")) {
    return "📕";
  }

  if (mimeType.includes("word") || mimeType.includes("document")) {
    return "📝";
  }

  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "📊";
  }

  return "📄";
}

export function AttachmentPreview({
  file,
  previewUrl,
  onRemove,
}: AttachmentPreviewProps) {
  const mimeType = file.mimeType ?? "";
  const isImage = mimeType.startsWith("image/");

  const fileLabel = getFileLabel(file);

  return (
    <View style={styles.container}>
      {isImage && previewUrl ? (
        <Image
          source={{ uri: previewUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={fileLabel}
        />
      ) : (
        <View style={styles.fileContent}>
          <Text style={styles.fileIcon}>{getFileIcon(file)}</Text>

          <Text style={styles.fileName} numberOfLines={2} ellipsizeMode="tail">
            {fileLabel}
          </Text>

          {file.fileSize !== null && file.fileSize !== undefined && (
            <Text style={styles.fileSize}>{formatFileSize(file.fileSize)}</Text>
          )}
        </View>
      )}

      {onRemove && (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer ${fileLabel}`}
          accessibilityHint="Retire cette pièce jointe"
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}
        >
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} Ko`;
  }

  const megabytes = kilobytes / 1024;

  if (megabytes < 1024) {
    return `${megabytes.toFixed(1)} Mo`;
  }

  const gigabytes = megabytes / 1024;

  return `${gigabytes.toFixed(1)} Go`;
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 96,
    height: 96,
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  fileContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  fileIcon: {
    fontSize: 26,
    marginBottom: 3,
  },

  fileName: {
    width: "100%",
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
  },

  fileSize: {
    marginTop: 2,
    fontSize: 9,
    color: "rgba(255,255,255,0.40)",
  },

  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  removeButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },

  removeText: {
    marginTop: -1,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "500",
    color: "#ffffff",
  },
});

export default AttachmentPreview;
