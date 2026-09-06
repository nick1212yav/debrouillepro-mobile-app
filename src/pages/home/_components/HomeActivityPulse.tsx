import { View, Pressable, Text, Image } from "react-native";
import {
  Activity,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export type HomeActivityPulseType =
  | "like"
  | "comment"
  | "message"
  | "follow"
  | "opportunity"
  | "success"
  | "recommendation"
  | "system"
  | "activity";

export interface HomeActivityPulseItem {
  id: string;

  type: HomeActivityPulseType;

  title: string;

  description?: string;

  timestamp: number | string | Date;

  read?: boolean;

  href?: string;

  moduleId?: string;

  actorName?: string;

  actorAvatar?: string;

  metadata?: {
    value?: string | number;

    label?: string;

    image?: string;
  };
}

export interface HomeActivityPulseStats {
  today?: number;

  thisWeek?: number;

  unread?: number;

  streak?: number;
}

interface HomeActivityPulseProps {
  items?: HomeActivityPulseItem[];

  stats?: HomeActivityPulseStats;

  loading?: boolean;

  onOpen?: () => void;

  onItemClick?: (item: HomeActivityPulseItem) => void;

  onMarkRead?: (item: HomeActivityPulseItem) => void;

  onMarkAllRead?: () => void;

  onNavigate?: (route: string) => void;

  maxItems?: number;

  className?: string;

  compact?: boolean;
}

/* ============================================================================
 * VISUAL SYSTEM
 * ========================================================================== */

const TYPE_CONFIG: Record<
  HomeActivityPulseType,
  {
    icon: typeof Activity;

    color: string;

    background: string;

    label: string;
  }
> = {
  like: {
    icon: Heart,
    color: "#F43F5E",
    background: "rgba(244,63,94,.11)",
    label: "Interaction",
  },

  comment: {
    icon: MessageCircle,
    color: "#8B5CF6",
    background: "rgba(139,92,246,.11)",
    label: "Conversation",
  },

  message: {
    icon: MessageCircle,
    color: "#06B6D4",
    background: "rgba(6,182,212,.11)",
    label: "Message",
  },

  follow: {
    icon: UserPlus,
    color: "#10B981",
    background: "rgba(16,185,129,.11)",
    label: "Réseau",
  },

  opportunity: {
    icon: BriefcaseBusiness,
    color: "#F59E0B",
    background: "rgba(245,158,11,.11)",
    label: "Opportunité",
  },

  success: {
    icon: CheckCircle2,
    color: "#22C55E",
    background: "rgba(34,197,94,.11)",
    label: "Réussi",
  },

  recommendation: {
    icon: Sparkles,
    color: "#A78BFA",
    background: "rgba(167,139,250,.11)",
    label: "Pour vous",
  },

  system: {
    icon: Bell,
    color: "#60A5FA",
    background: "rgba(96,165,250,.11)",
    label: "Information",
  },

  activity: {
    icon: Activity,
    color: "#14B8A6",
    background: "rgba(20,184,166,.11)",
    label: "Activité",
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function toTimestamp(value: number | string | Date): number {
  if (typeof value === "number") {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : Date.now();
}

function formatRelativeTime(value: number | string | Date): string {
  const timestamp = toTimestamp(value);

  const diff = Math.max(0, Date.now() - timestamp);

  const minute = 60_000;

  const hour = 60 * minute;

  const day = 24 * hour;

  if (diff < minute) {
    return "À l'instant";
  }

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);

    return `Il y a ${minutes} min`;
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour);

    return `Il y a ${hours} h`;
  }

  if (diff < 7 * day) {
    const days = Math.floor(diff / day);

    return `Il y a ${days} j`;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
}

function sortNewestFirst(items: HomeActivityPulseItem[]) {
  return [...items].sort(
    (a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp),
  );
}

function initials(name?: string): string {
  if (!name) {
    return "DP";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function HomeActivityPulse({
  items = [],
  stats,
  loading = false,
  onOpen,
  onItemClick,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  maxItems = 5,
  className = "",
  compact = false,
}: HomeActivityPulseProps) {
  const [now, setNow] = useState(() => Date.now());

  /*
   * Keep relative timestamps fresh without
   * polling the backend.
   */
  useEffect(() => {
    const interval = undefined;

    return () => undefined;
  }, []);

  const orderedItems = useMemo(
    () => sortNewestFirst(items).slice(0, maxItems),
    [items, maxItems],
  );

  const unreadCount =
    stats?.unread ?? items.filter((item) => item.read === false).length;

  const todayCount =
    stats?.today ??
    items.filter(
      (item) => now - toTimestamp(item.timestamp) < 24 * 60 * 60 * 1000,
    ).length;

  const weekCount =
    stats?.thisWeek ??
    items.filter(
      (item) => now - toTimestamp(item.timestamp) < 7 * 24 * 60 * 60 * 1000,
    ).length;

  const handleItemClick = (item: HomeActivityPulseItem) => {
    if (!item.read) {
      onMarkRead?.(item);
    }

    if (item.href) {
      onNavigate?.(item.href);
      return;
    }

    onItemClick?.(item);
  };

  /* --------------------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------------------ */

  if (loading) {
    return <ActivityPulseSkeleton className={className} />;
  }

  return (
    <View
      className={["mx-5", compact ? "mt-2" : "mt-4", className].join(" ")}
    >
      {/* ======================================================================
          HEADER
         ==================================================================== */}

      <View className="mb-3 flex items-center justify-between">
        <View className="flex min-w-0 items-center gap-2.5">
          <View
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]"
            style={{ borderWidth: 1, borderColor: "rgba(20,184,166,.16)", borderStyle: "solid" }}
          >
            <Activity size={15} className="text-teal-300" />

            {unreadCount > 0 && (
              <Text
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#09090d] bg-cyan-400"
              />
            )}
          </View>

          <View className="min-w-0">
            <View className="flex items-center gap-1.5">
              <Text className="truncate text-[12px] font-black tracking-[-.02em] text-white/85">
                Votre activité
              </Text>

              {unreadCount > 0 && (
                <Text
                  className="rounded-full px-1.5 py-0.5 text-[7px] font-black"
                  style={{ backgroundColor: "rgba(59,130,246,.12)", color: "#93C5FD" }}
                >
                  {unreadCount} nouveau
                  {unreadCount > 1 ? "x" : ""}
                </Text>
              )}
            </View>

            <Text className="mt-0.5 text-[8px] text-white/25">
              Ce qui bouge autour de vous
            </Text>
          </View>
        </View>

        <Pressable
         
          onPress={onOpen}
          className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-[8px] font-bold text-white/30"
        >
          <Text>Tout voir</Text><ChevronRight size={11} />
        </Pressable>
      </View>

      {/* ======================================================================
          LIVE SUMMARY
         ==================================================================== */}

      <View className="mb-3 gap-2">
        <PulseStat
          icon={Zap}
          value={todayCount}
          label="aujourd'hui"
          color="#14B8A6"
        />

        <PulseStat
          icon={TrendingUp}
          value={weekCount}
          label="cette semaine"
          color="#8B5CF6"
        />

        <PulseStat
          icon={Clock3}
          value={unreadCount}
          label="à découvrir"
          color="#F59E0B"
        />
      </View>

      {/* ======================================================================
          EMPTY
         ==================================================================== */}

      {orderedItems.length === 0 && <EmptyActivity onOpen={onOpen} />}

      {/* ======================================================================
          TIMELINE
         ==================================================================== */}

      {orderedItems.length > 0 && (
        <View
          className="relative overflow-hidden rounded-[26px]"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.055)", borderStyle: "solid" }}
        >
          {/* Ambient glow */}

          <View
            className="absolute -right-20 -top-20 h-40 w-40 rounded-full"
            style={{  }}
          />

          <View className="relative">
            <>
              {orderedItems.map((item, index) => (
                <ActivityRow
                  key={item.id}
                  item={item}
                  index={index}
                  isLast={index === orderedItems.length - 1}
                  onPress={() => handleItemClick(item)}
                />
              ))}
            </>
          </View>

          {/* Bottom CTA */}

          {items.length > maxItems && (
            <Pressable
             
              onPress={onOpen}
              className="flex w-full items-center justify-center gap-1.5 border-t border-white/[.045] py-3 text-[8px] font-black text-white/30"
            >
              <Text>Voir les</Text>{items.length - maxItems} <Text>autres activités</Text><ArrowRight size={10} />
            </Pressable>
          )}
        </View>
      )}

      {/* ======================================================================
          MARK ALL
         ==================================================================== */}

      {unreadCount > 0 && onMarkAllRead && (
        <Pressable
          onPress={onMarkAllRead}
          className="mx-auto mt-2 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[7px] font-bold text-white/20"
        >
          <CheckCircle2 size={10} />
          Tout marquer comme lu
        </Pressable>
      )}
    </View>
  );
}

/* ============================================================================
 * ACTIVITY ROW
 * ========================================================================== */

function ActivityRow({
  item,
  index,
  isLast,
  onClick,
}: {
  item: HomeActivityPulseItem;

  index: number;

  isLast: boolean;

  onClick: () => void;
}) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.activity;

  const Icon = config.icon;

  const unread = item.read === false;

  return (
    <Pressable
      onPress={onClick}
      className="group relative flex w-full gap-3 px-3.5 py-3 text-left"
    >
      {/* Timeline */}

      {!isLast && (
        <View
          className="absolute bottom-0 left-[30px] top-[54px] w-px"
          style={{  }}
        />
      )}

      {/* Actor / event icon */}

      <View className="relative z-10 shrink-0">
        {item.actorAvatar ? (
          <View className="relative">
            <Image
             
             
              className="h-9 w-9 rounded-[13px] object-cover"
              loading="lazy"
             source={{ uri: item.actorAvatar }} accessibilityLabel=""/>

            <View
              className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#111117]"
              style={{ backgroundColor: config.color }}
            >
              <Icon size={7} className="text-white" strokeWidth={3} />
            </View>
          </View>
        ) : (
          <View
            className="flex h-9 w-9 items-center justify-center rounded-[13px]"
            style={{ backgroundColor: config.background, borderStyle: "solid" }}
          >
            <Icon
              size={14}
              style={{
                color: config.color,
              }}
            />
          </View>
        )}

        {unread && (
          <Text
            className="absolute -left-1 -top-1 h-2 w-2 rounded-full border border-[#111117]"
            style={{ backgroundColor: config.color }}
          />
        )}
      </View>

      {/* Content */}

      <View className="min-w-0 flex-1 pt-0.5">
        <View className="flex items-start gap-2">
          <View className="min-w-0 flex-1">
            <Text
              className={[
                "line-clamp-2 text-[9px] leading-relaxed",
                unread
                  ? "font-bold text-white/80"
                  : "font-medium text-white/50",
              ].join(" ")}
            >
              {item.actorName && (
                <Text className="font-black text-white/80">
                  {item.actorName}{" "}
                </Text>
              )}

              {item.title}
            </Text>

            {item.description && (
              <Text className="mt-0.5 text-[7px] text-white/20">
                {item.description}
              </Text>
            )}
          </View>

          <Text className="shrink-0 pt-0.5 text-[7px] font-medium text-white/20">
            {formatRelativeTime(item.timestamp)}
          </Text>
        </View>

        {/* Metadata */}

        {item.metadata && (
          <View className="mt-2 flex items-center gap-2">
            {item.metadata.image && (
              <Image
               
               
                className="h-7 w-7 rounded-lg object-cover"
                loading="lazy"
               source={{ uri: item.metadata.image }} accessibilityLabel=""/>
            )}

            {item.metadata.value !== undefined && (
              <Text
                className="rounded-lg px-2 py-1 text-[7px] font-black"
                style={{ backgroundColor: `${config.color}0D`, color: config.color }}
              >
                {item.metadata.value}
              </Text>
            )}

            {item.metadata.label && (
              <Text className="truncate text-[7px] text-white/20">
                {item.metadata.label}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Arrow */}

      <View className="flex shrink-0 items-center justify-center text-white/10">
        <ChevronRight size={12} />
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * STAT
 * ========================================================================== */

function PulseStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Zap;

  value: number;

  label: string;

  color: string;
}) {
  return (
    <View
      className="flex items-center gap-2 rounded-[17px] p-2.5"
      style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.045)", borderStyle: "solid" }}
    >
      <View
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: `${color}12` }}
      >
        <Icon
          size={11}
          style={{
            color,
          }}
        />
      </View>

      <View className="min-w-0">
        <Text className="text-[10px] font-black text-white/70">{value}</Text>

        <Text className="truncate text-[7px] text-white/20">{label}</Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyActivity({ onOpen }: { onOpen?: () => void }) {
  return (
    <View
      className="overflow-hidden rounded-[26px] p-5"
      style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.05)", borderStyle: "solid" }}
    >
      <View className="flex items-center gap-4">
        <View
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px]"
          style={{ backgroundColor: "rgba(20,184,166,.08)", borderWidth: 1, borderColor: "rgba(20,184,166,.12)", borderStyle: "solid" }}
        >
          <Activity size={18} className="text-teal-300/70" />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-[10px] font-black text-white/65">
            Votre espace est calme
          </Text>

          <Text className="mt-1 text-[8px] leading-relaxed text-white/25">
            Les interactions, opportunités et événements importants apparaîtront
            ici.
          </Text>
        </View>

        {onOpen && (
          <Pressable
           
            onPress={onOpen}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white/25"
            style={{ backgroundColor: "rgba(255,255,255,.04)" }}
            accessibilityLabel="Ouvrir l'activité"
          >
            <ArrowRight size={12} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function ActivityPulseSkeleton({ className = "" }: { className?: string }) {
  return (
    <View className={`mx-5 mt-4 ${className}`}>
      <View className="mb-3 flex items-center gap-2.5">
        <View className="h-9 w-9 animate-pulse rounded-[13px] bg-white/[.06]" />

        <View className="space-y-1.5">
          <View className="h-2.5 w-24 animate-pulse rounded-full bg-white/[.06]" />
          <View className="h-1.5 w-32 animate-pulse rounded-full bg-white/[.04]" />
        </View>
      </View>

      <View className="mb-3 gap-2">
        {[0, 1, 2].map((item) => (
          <View
            key={item}
            className="h-12 animate-pulse rounded-[17px] bg-white/[.035]"
          />
        ))}
      </View>

      <View
        className="overflow-hidden rounded-[26px]"
        style={{ backgroundColor: "rgba(255,255,255,.025)", borderWidth: 1, borderColor: "rgba(255,255,255,.04)", borderStyle: "solid" }}
      >
        {[0, 1, 2, 3].map((item) => (
          <View
            key={item}
            className="flex gap-3 border-b border-white/[.035] p-3.5 last:border-0"
          >
            <View className="h-9 w-9 animate-pulse rounded-[13px] bg-white/[.05]" />

            <View className="flex-1 space-y-2 pt-1">
              <View className="h-2 w-3/4 animate-pulse rounded-full bg-white/[.05]" />
              <View className="h-1.5 w-1/2 animate-pulse rounded-full bg-white/[.035]" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
