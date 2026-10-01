// src/features/profile/components/ActivityTimeline.tsx

import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { Activity, ChevronRight, Trash2 } from "lucide-react-native";
import { toast } from "sonner";

import { useActivity } from "@/hooks/use-activity.ts";
import { getLevelProgress, usePoints } from "@/hooks/use-points.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

interface ActivityTimelineProps {
  accentHex: string;
}

interface TimelineItem {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  time: string;
  color: string;
}

const MAX_ACTIVITY_ITEMS = 8;
const MAX_XP_ITEMS = 3;
const MAX_TIMELINE_ITEMS = 10;

function formatActivityDate(timestamp: number): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatXpDate(timestamp: number): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function getActivityEmoji(type: string): string {
  switch (type) {
    case "view_module":
      return "📱";

    case "search":
      return "🔍";

    case "create_publication":
      return "📝";

    default:
      return "👁️";
  }
}

export function ActivityTimeline({ accentHex }: ActivityTimelineProps) {
  const { entries, isLoading, clear } = useActivity();
  const { history, total } = usePoints();

  // Keep the level computation connected to the real XP source.
  getLevelProgress(total);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const activityItems: TimelineItem[] = entries
      .slice(0, MAX_ACTIVITY_ITEMS)
      .map((entry) => ({
        id: `activity-${entry._id}`,
        emoji: getActivityEmoji(entry.type),
        title: entry.label,
        sub: entry.target ?? entry.type,
        time: formatActivityDate(entry._creationTime),
        color: accentHex,
      }));

    const xpItems: TimelineItem[] = history
      .slice(0, MAX_XP_ITEMS)
      .map((entry) => ({
        id: `xp-${entry.id}`,
        emoji: entry.emoji,
        title: entry.action,
        sub: `${entry.module} · +${entry.points} XP`,
        time: formatXpDate(entry.timestamp),
        color: "#f59e0b",
      }));

    return [...activityItems, ...xpItems].slice(0, MAX_TIMELINE_ITEMS);
  }, [accentHex, entries, history]);

  const handleClear = async () => {
    try {
      await clear();
      toast.success("Historique effacé");
    } catch (error) {
      console.error("Failed to clear activity history:", error);
      toast.error("Impossible d’effacer l’historique");
    }
  };

  const hasActivity = entries.length > 0;

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Activity size={12} color="rgba(255,255,255,0.5)" />

          <Text className="ml-1.5 text-xs font-bold uppercase tracking-wider text-white/50">
            Timeline d’activité
          </Text>
        </View>

        {hasActivity ? (
          <Pressable
            onPress={() => {
              void handleClear();
            }}
            accessibilityRole="button"
            accessibilityLabel="Effacer l’historique d’activité"
            className="flex-row items-center rounded-lg px-2 py-1"
            hitSlop={8}
          >
            <Trash2 size={11} color="rgba(255,255,255,0.3)" />

            <Text className="ml-1 text-[10px] font-medium text-white/30">
              Effacer
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Loading */}
      {isLoading ? (
        <View>
          {[0, 1, 2].map((index) => (
            <View
              key={`activity-skeleton-${index}`}
              className={index === 0 ? "" : "mt-2"}
            >
              <Skeleton className="h-14 w-full rounded-2xl" />
            </View>
          ))}
        </View>
      ) : timelineItems.length === 0 ? (
        /* Empty state */
        <View className="items-center rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 py-7">
          <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05]">
            <Activity size={22} color="rgba(255,255,255,0.2)" />
          </View>

          <Text className="text-xs font-semibold text-white/40">
            Aucune activité récente
          </Text>

          <Text className="mt-1 text-center text-[10px] leading-4 text-white/20">
            Explorez les modules de DébrouillePro pour commencer votre activité.
          </Text>
        </View>
      ) : (
        /* Timeline */
        <View className="relative">
          {/* Timeline rail */}
          <View
            className="absolute bottom-5 left-[15px] top-5 w-px"
            style={{
              backgroundColor: "rgba(255,255,255,0.07)",
            }}
          />

          <View>
            {timelineItems.map((item) => (
              <View
                key={item.id}
                className="mb-2.5 flex-row items-center rounded-2xl border p-3"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                {/* Timeline icon */}
                <View
                  className="z-10 h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: `${item.color}18`,
                    borderColor: `${item.color}30`,
                  }}
                >
                  <Text className="text-base">{item.emoji}</Text>
                </View>

                {/* Content */}
                <View className="ml-3 min-w-0 flex-1">
                  <Text
                    className="text-xs font-semibold text-white"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>

                  <Text
                    className="mt-0.5 text-[10px] text-white/40"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.sub}
                  </Text>
                </View>

                {/* Timestamp */}
                <View className="ml-2 flex-shrink-0 items-end">
                  <Text className="text-[9px] text-white/25">{item.time}</Text>

                  <ChevronRight
                    size={11}
                    color="rgba(255,255,255,0.15)"
                    style={{ marginTop: 3 }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
