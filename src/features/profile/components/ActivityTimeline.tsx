import { View, Text, Pressable } from "react-native";

// src/features/profile/components/ActivityTimeline.tsx
import { Activity } from "lucide-react-native";
import { toast } from "sonner";
import { useActivity } from "@/hooks/use-activity.ts";
import { usePoints, getLevelProgress } from "@/hooks/use-points.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

interface ActivityTimelineProps {
  accentHex: string;
}

export function ActivityTimeline({ accentHex }: ActivityTimelineProps) {
  const { entries, isLoading, clear } = useActivity();
  const { history, total } = usePoints();
  const { level } = getLevelProgress(total);

  const convexItems = entries.slice(0, 8).map((e) => ({
    id: e._id,
    emoji:
      e.type === "view_module"
        ? "📱"
        : e.type === "search"
          ? "🔍"
          : e.type === "create_publication"
            ? "📝"
            : "👁️",
    title: e.label,
    sub: e.target ?? e.type,
    time: new Date(e._creationTime).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    color: accentHex,
  }));

  const xpItems = history.slice(0, 3).map((e) => ({
    id: e.id,
    emoji: e.emoji,
    title: e.action,
    sub: `${e.module} · +${e.points} XP`,
    time: new Date(e.timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    }),
    color: "#f59e0b",
  }));

  const combined = [...convexItems, ...xpItems].slice(0, 10);

  return (
    <View className="mb-4"><View className="flex items-center justify-between mb-3"><Text className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5"><Activity size={11} />Timeline d&apos;activité
        </Text>{entries.length > 0 && (
          <Pressable onPress={() => {
              clear().catch(() => null);
              toast.success("Historique effacé");
            }} className="text-[10px] text-white/30 transition-colors"><Text>Effacer</Text></Pressable>
        )}</View>{isLoading ? (
        <View className="space-y-2">{[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-2xl" />
          ))}</View>
      ) : combined.length === 0 ? (
        <View className="text-center py-6"><Activity size={24} className="mx-auto mb-2 text-white/20" /><Text className="text-white/30 text-xs">Aucune activité récente</Text><Text className="text-white/20 text-[10px] mt-1">Explorez des modules pour commencer
          </Text></View>
      ) : (
        <View className="relative pl-4"><View className="absolute left-5 top-3 bottom-3 w-px" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} /><View className="flex flex-col gap-3">{combined.map((item, i) => (
              <View key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                <View className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 z-10" style={{ backgroundColor: `${item.color}18`, borderStyle: "solid" }}>{item.emoji}</View>
                <View className="flex-1 min-w-0"><View className="text-white text-xs font-semibold truncate">{item.title}</View><View className="text-white/40 text-[10px]">{item.sub}</View></View>
                <View className="text-white/25 text-[10px] flex-shrink-0">
                  {item.time}
                </View>
              </View>
            ))}</View></View>
      )}</View>
  );
}
