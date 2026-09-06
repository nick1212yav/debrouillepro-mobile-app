import { View, Text } from "react-native";

// src/features/creator-hub/components/PubRow.tsx
import {
  Eye,
  Heart,
  MessageCircle,
  FileText,
  Video,
  BarChart3,
  Home,
  Briefcase,
  Users,
} from "lucide-react-native";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CreatorPub } from "../types";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  article: <FileText size={12} />,
  video: <Video size={12} />,
  sondage: <BarChart3 size={12} />,
  immo: <Home size={12} />,
  job: <Briefcase size={12} />,
  community: <Users size={12} />,
};

const TYPE_COLORS: Record<string, string> = {
  article: "#06B6D4",
  video: "#EF4444",
  sondage: "#A855F7",
  immo: "#10B981",
  job: "#8B5CF6",
  community: "#3B82F6",
};

interface PubRowProps {
  pub: CreatorPub;
}

export function PubRow({ pub }: PubRowProps) {
  const color = TYPE_COLORS[pub.type] ?? "#8B5CF6";
  const icon = TYPE_ICONS[pub.type] ?? <FileText size={12} />;
  return (
    <View
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
    >
      <View
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}22` }}
      >
        {icon}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-white text-sm font-semibold truncate">{pub.title}</Text>
        <Text className="text-white/30 text-[10px]">
          {format(new Date(pub.createdAt), "d MMM", { locale: fr })}
        </Text>
      </View>
      <View className="flex items-center gap-3 flex-shrink-0">
        <View className="flex items-center gap-1 text-white/40">
          <Eye size={10} />
          <Text className="text-[10px]">{fmt(pub.viewCount)}</Text>
        </View>
        <View className="flex items-center gap-1 text-white/40">
          <Heart size={10} />
          <Text className="text-[10px]">{fmt(pub.likeCount)}</Text>
        </View>
        <View className="flex items-center gap-1 text-white/40">
          <MessageCircle size={10} />
          <Text className="text-[10px]">{fmt(pub.commentCount)}</Text>
        </View>
      </View>
    </View>
  );
}
