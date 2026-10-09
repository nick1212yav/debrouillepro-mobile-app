// src/features/messages/forwarding/components/ForwardPreview.tsx

import {
  FileText,
  Image as ImageIcon,
  MapPin,
  Mic,
  Paperclip,
  Video,
} from "lucide-react-native";
import { Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

interface ForwardPreviewProps {
  message: {
    _id: Id<"messages">;
    text: string;
    type?: string;
    voiceDuration?: number;
  };

  compact?: boolean;
}

interface PreviewData {
  label: string;
  icon: React.ReactNode;
}

function getPreview(message: ForwardPreviewProps["message"]): PreviewData {
  switch (message.type) {
    case "image":
      return {
        label: "Photo",
        icon: <ImageIcon size={16} color="#a78bfa" />,
      };

    case "video":
      return {
        label: "Vidéo",
        icon: <Video size={16} color="#a78bfa" />,
      };

    case "audio":
      return {
        label: "Audio",
        icon: <Mic size={16} color="#a78bfa" />,
      };

    case "voice":
      return {
        label: "Message vocal",
        icon: <Mic size={16} color="#a78bfa" />,
      };

    case "file":
      return {
        label: "Fichier",
        icon: <FileText size={16} color="#a78bfa" />,
      };

    case "location":
      return {
        label: "Localisation",
        icon: <MapPin size={16} color="#a78bfa" />,
      };

    default:
      return {
        label: message.text.trim() || "Message",
        icon: <Paperclip size={16} color="#a78bfa" />,
      };
  }
}

export function ForwardPreview({
  message,
  compact = false,
}: ForwardPreviewProps) {
  const preview = getPreview(message);

  return (
    <View
      style={[
        styles.container,
        compact ? styles.containerCompact : styles.containerRegular,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Message à transférer : ${preview.label}`}
    >
      <View style={styles.iconWrapper}>{preview.icon}</View>

      <View style={styles.content}>
        <Text style={styles.label}>Transférer</Text>

        <Text
          style={[
            styles.previewText,
            !message.text.trim() && styles.previewTextMuted,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {preview.label}
        </Text>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  containerRegular: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  containerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  iconWrapper: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: 8,
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#a78bfa",
  },

  previewText: {
    marginTop: 2,
    fontSize: 14,
    color: "rgba(255,255,255,0.70)",
  },

  previewTextMuted: {
    color: "rgba(255,255,255,0.40)",
  },
};

export default ForwardPreview;
