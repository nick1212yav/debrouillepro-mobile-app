// src/features/messages/media/components/FilePreview.tsx

import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

interface FilePreviewProps {
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  href?: string;
}

function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes < 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(mimeType?: string): string {
  if (!mimeType) {
    return "📄";
  }

  if (mimeType.startsWith("image/")) {
    return "🖼️";
  }

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

  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
    return "📊";
  }

  if (mimeType.includes("zip") || mimeType.includes("compressed")) {
    return "🗜️";
  }

  return "📄";
}

export function FilePreview({
  fileName,
  fileSize,
  mimeType,
  href,
}: FilePreviewProps) {
  const sizeLabel = formatFileSize(fileSize);

  const metadata = [mimeType || "Fichier", sizeLabel]
    .filter(Boolean)
    .join(" · ");

  const content = (
    <>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getFileIcon(mimeType)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
          {fileName}
        </Text>

        <Text style={styles.metadata} numberOfLines={1} ellipsizeMode="tail">
          {metadata}
        </Text>
      </View>

      {href ? <Text style={styles.openIcon}>↗</Text> : null}
    </>
  );

  if (href) {
    return (
      <Pressable
        onPress={() => {
          void Linking.openURL(href);
        }}
        accessibilityRole="link"
        accessibilityLabel={`Ouvrir ${fileName}`}
        accessibilityHint="Ouvre le fichier"
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 360,
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },

  iconContainer: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  icon: {
    fontSize: 20,
  },

  info: {
    minWidth: 0,
    flex: 1,
  },

  fileName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: "#ffffff",
  },

  metadata: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.48)",
  },

  openIcon: {
    flexShrink: 0,
    fontSize: 18,
    color: "rgba(255,255,255,0.60)",
  },
});

export default FilePreview;
