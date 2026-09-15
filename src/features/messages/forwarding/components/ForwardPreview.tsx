import { View, Text } from "react-native";
import {
  FileText,
  Image as ImageIcon,
  MapPin,
  Mic,
  Paperclip,
  Video,
} from "lucide-react-native";

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

function getPreview(message: ForwardPreviewProps["message"]) {
  switch (message.type) {
    case "image":
      return {
        label: "Photo",
        icon: <ImageIcon size={16} />,
      };

    case "video":
      return {
        label: "Vidéo",
        icon: <Video size={16} />,
      };

    case "audio":
      return {
        label: "Audio",
        icon: <Mic size={16} />,
      };

    case "voice":
      return {
        label: "Message vocal",
        icon: <Mic size={16} />,
      };

    case "file":
      return {
        label: "Fichier",
        icon: <FileText size={16} />,
      };

    case "location":
      return {
        label: "Localisation",
        icon: <MapPin size={16} />,
      };

    default:
      return {
        label: message.text || "Message",
        icon: <Paperclip size={16} />,
      };
  }
}

export function ForwardPreview({
  message,
  compact = false,
}: ForwardPreviewProps) {
  const preview = getPreview(message);

  return (
    <View className={[
        "flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04]",
        compact ? "px-3 py-2" : "px-4 py-3",
      ].join(" ")}><View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">{preview.icon}</View><View className="min-w-0 flex-1"><Text className="text-[11px] font-medium text-violet-400">Transférer</Text><Text className={[
            "truncate text-sm text-white/70",
            !message.text && "text-white/40",
          ].join(" ")}>{preview.label}</Text></View></View>
  );
}

export default ForwardPreview;
