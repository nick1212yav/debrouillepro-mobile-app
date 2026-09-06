import { View, Text, Pressable, NativeSyntheticEvent, TextInputKeyPressEventData, ViewStyle, TextStyle, ImageStyle } from "react-native";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  type ComponentType
} from "react";
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Heart,
  MessageCircle,
  UserPlus,
  CreditCard,
  Package,
  Bus,
  Leaf,
  Home,
  Briefcase,
  Users,
  Settings2,
  BellOff,
  BellRing,
  CalendarDays,
  Sparkles,
  ChevronRight,
  Pin,
  AlertCircle,
  CircleDollarSign,
  Megaphone,
  Newspaper,
  ShieldCheck,
  RefreshCw,
} from "lucide-react-native";

import { useNotifications } from "@/hooks/use-notifications";
import type { Id } from "@/convex/_generated/dataModel.js";

type NotifType =
  | "like"
  | "comment"
  | "follow"
  | "message"
  | "job"
  | "immo"
  | "payment"
  | "system"
  | "delivery"
  | "sante"
  | "agri"
  | "transport"
  | "community"
  | "boost"
  | "event"
  | "streak"
  | "digest"
  | "annonce";

type Priority = "high" | "normal" | "low";

interface NotificationItem {
  id: Id<"notifications">;
  type: NotifType;
  title: string;
  body: string;
  module: string;
  read: boolean;
  timestamp: number;
  pinned?: boolean;
  priority?: Priority;
  initials?: string;
  actionPage?: string;
  amount?: string;
  actionButtons?: Array<{
    label: string;
    variant: "primary" | "danger";
  }>;
}

interface Props {
  onClose: () => void;
  onNavigate: (page: string) => void;
}

interface TypeConfig {
  icon: ComponentType<{
    size?: number;
    className?: string;
    style?: ViewStyle | TextStyle | ImageStyle;
  }>;
  color: string;
  background: string;
  label: string;
}

const TYPE_CONFIG: Record<NotifType, TypeConfig> = {
  like: {
    icon: Heart,
    color: "#F43F5E",
    background: "rgba(244,63,94,.13)",
    label: "J'aime",
  },
  comment: {
    icon: MessageCircle,
    color: "#60A5FA",
    background: "rgba(96,165,250,.13)",
    label: "Commentaires",
  },
  follow: {
    icon: UserPlus,
    color: "#A78BFA",
    background: "rgba(167,139,250,.13)",
    label: "Réseau",
  },
  message: {
    icon: MessageCircle,
    color: "#38BDF8",
    background: "rgba(56,189,248,.13)",
    label: "Messages",
  },
  job: {
    icon: Briefcase,
    color: "#A78BFA",
    background: "rgba(167,139,250,.13)",
    label: "Emploi",
  },
  immo: {
    icon: Home,
    color: "#FB923C",
    background: "rgba(251,146,60,.13)",
    label: "Immobilier",
  },
  payment: {
    icon: CircleDollarSign,
    color: "#34D399",
    background: "rgba(52,211,153,.13)",
    label: "Finance",
  },
  system: {
    icon: ShieldCheck,
    color: "#94A3B8",
    background: "rgba(148,163,184,.10)",
    label: "Système",
  },
  delivery: {
    icon: Package,
    color: "#FBBF24",
    background: "rgba(251,191,36,.13)",
    label: "Livraison",
  },
  sante: {
    icon: Heart,
    color: "#FB7185",
    background: "rgba(251,113,133,.13)",
    label: "Santé",
  },
  agri: {
    icon: Leaf,
    color: "#4ADE80",
    background: "rgba(74,222,128,.13)",
    label: "Agriculture",
  },
  transport: {
    icon: Bus,
    color: "#22D3EE",
    background: "rgba(34,211,238,.13)",
    label: "Transport",
  },
  community: {
    icon: Users,
    color: "#F472B6",
    background: "rgba(244,114,182,.13)",
    label: "Communauté",
  },
  boost: {
    icon: Sparkles,
    color: "#FBBF24",
    background: "rgba(251,191,36,.13)",
    label: "Boost",
  },
  event: {
    icon: CalendarDays,
    color: "#818CF8",
    background: "rgba(129,140,248,.13)",
    label: "Événements",
  },
  streak: {
    icon: BellRing,
    color: "#FB923C",
    background: "rgba(251,146,60,.13)",
    label: "Série",
  },
  digest: {
    icon: Newspaper,
    color: "#C084FC",
    background: "rgba(192,132,252,.13)",
    label: "Résumé",
  },
  annonce: {
    icon: Megaphone,
    color: "#F59E0B",
    background: "rgba(245,158,11,.13)",
    label: "Annonce",
  },
};

const FILTERS = [
  {
    id: "all",
    label: "Tout",
    types: null,
  },
  {
    id: "network",
    label: "Réseau",
    types: ["like", "comment", "follow", "community"] as NotifType[],
  },
  {
    id: "messages",
    label: "Messages",
    types: ["message"] as NotifType[],
  },
  {
    id: "opportunities",
    label: "Opportunités",
    types: [
      "job",
      "immo",
      "delivery",
      "transport",
      "agri",
      "event",
      "annonce",
    ] as NotifType[],
  },
  {
    id: "finance",
    label: "Finance",
    types: ["payment", "boost"] as NotifType[],
  },
  {
    id: "system",
    label: "Système",
    types: ["system", "streak", "digest", "sante"] as NotifType[],
  },
] as const;

function normalizeNotification(
  notification: ReturnType<typeof useNotifications>["notifs"][number],
): NotificationItem {
  return {
    id: notification.id,
    type: notification.type as NotifType,
    title: notification.title,
    body: notification.body,
    module: notification.module,
    read: notification.read,
    timestamp: notification.timestamp,
    pinned: notification.pinned,
    priority: notification.priority as Priority,
    initials: notification.initials,
    actionPage: notification.actionPage,
    amount: notification.amount,
    actionButtons: notification.actionButtons,
  };
}

function formatRelativeTime(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return "À l'instant";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Il y a ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Hier";
  }

  if (days < 7) {
    return `Il y a ${days} j`;
  }

  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function getConfig(type: string): TypeConfig {
  return TYPE_CONFIG[type as NotifType] ?? TYPE_CONFIG.system;
}

function NotificationIcon({
  notification,
}: {
  notification: NotificationItem;
}) {
  const config = getConfig(notification.type);
  const Icon = config.icon;

  if (notification.initials) {
    return (
      <View
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black"
        style={{ backgroundColor: config.background }}
      >
        {notification.initials.slice(0, 2).toUpperCase()}

        <Text
          className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border"
          style={{ backgroundColor: "#0B0B18", borderColor: config.color, color: config.color }}
        >
          <Icon size={10} />
        </Text>
      </View>
    );
  }

  return (
    <View
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
      style={{ backgroundColor: config.background }}
    >
      <Icon
        size={19}
        className="shrink-0"
        style={{
          color: config.color,
        }}
      />

      {!notification.read && (
        <Text
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0B0B18]"
          style={{ backgroundColor: config.color }}
        />
      )}
    </View>
  );
}

function PriorityBadge({ priority }: { priority?: Priority }) {
  if (!priority || priority === "normal") {
    return null;
  }

  const high = priority === "high";

  return (
    <Text
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
      style={{ color: high ? "#FB7185" : "#94A3B8", backgroundColor: high ? "rgba(251,113,133,.10)" : "rgba(148,163,184,.08)" }}
    >
      {high && <AlertCircle size={9} />}
      {high ? "Important" : "Faible"}
    </Text>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
  onDismiss,
  onNavigate,
}: {
  notification: NotificationItem;
  onMarkRead: () => void;
  onDismiss: () => void;
  onNavigate: (page: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const config = getConfig(notification.type);

  const handleOpen = () => {
    if (!notification.read) {
      onMarkRead();
    }

    if (notification.actionPage) {
      onNavigate(notification.actionPage);
    }
  };

  const handleKeyDown = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleOpen();
    }

    if (event.key === "Escape") {
      setMenuOpen(false);
    }
  };

  return (
    <View
      className="group relative"
    >
      <Pressable
        accessibilityRole="button"
        tabIndex={0}
        onPress={handleOpen}
        onKeyDown={handleKeyDown}
        className="relative flex gap-3 overflow-hidden rounded-[1.25rem] border p-3.5 outline-none"
        style={{ borderColor: notification.read
                    ? "rgba(255,255,255,.055)"
                    : `${config.color}25` }}
      >
        {/* Unread accent */}
        {!notification.read && (
          <View
            className="absolute bottom-3 left-0 top-3 w-[2px] rounded-r-full"
            style={{ backgroundColor: config.color }}
          />
        )}

        <NotificationIcon notification={notification} />

        <View className="min-w-0 flex-1">
          <View className="flex items-start gap-2 pr-8">
            <Text
              className="text-[13px] font-bold leading-snug"
              style={{
                color: notification.read ? "rgba(255,255,255,.58)" : "#FFFFFF",
              }}
            >
              {notification.title}
            </Text>

            {notification.pinned && (
              <Pin
                size={11}
                className="mt-0.5 shrink-0"
                style={{
                  color: config.color,
                }}
              />
            )}
          </View>

          <Text className="mt-1 text-[11px] leading-relaxed text-white/38">
            {notification.body}
          </Text>

          <View className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Text
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ color: config.color, backgroundColor: config.background }}
            >
              {notification.module || config.label}
            </Text>

            <Text className="h-1 w-1 rounded-full bg-white/15" />

            <Text className="text-[9px] font-medium text-white/25">
              {formatRelativeTime(notification.timestamp)}
            </Text>

            <PriorityBadge priority={notification.priority} />
          </View>

          {notification.amount && (
            <View
              className="mt-2 text-xs font-black"
              style={{  }}
            >
              {notification.amount}
            </View>
          )}

          {notification.actionButtons &&
            notification.actionButtons.length > 0 && (
              <View className="mt-3 flex flex-wrap gap-2">
                {notification.actionButtons.map((action, index) => (
                  <Pressable
                    key={`${action.label}-${index}`}
                   
                    onPress={(event) => {
                      if (action.variant === "danger") {
                        onDismiss();
                      }
                    }}
                    className="rounded-xl border px-3 py-1.5 text-[10px] font-bold"
                    style={{ backgroundColor: action.variant === "danger"
                                              ? "rgba(251,113,133,.08)"
                                              : config.background, borderColor:
                                            action.variant === "danger"
                                              ? "rgba(251,113,133,.15)"
                                              : `${config.color}20` }}
                  >
                    {action.label}
                  </Pressable>
                ))}
              </View>
            )}
        </View>

        {/* Actions */}
        <View className="absolute right-2 top-2">
          <Pressable
           
            accessibilityLabel="Options de notification"
            onPress={(event) => {
              setMenuOpen((value) => !value);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 opacity-0"
          >
            <Text className="text-sm leading-none">•••</Text>
          </Pressable>

          <>
            {menuOpen && (
              <View
                className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border p-1 shadow-2xl"
                style={{ backgroundColor: "rgba(14,14,28,.98)", borderColor: "rgba(255,255,255,.08)" }}
              >
                {!notification.read && (
                  <Pressable
                   
                    onPress={(event) => {
                      onMarkRead();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-semibold text-white/60"
                  >
                    <CheckCheck size={12} />
                    <Text>Marquer comme lu</Text></Pressable>
                )}

                <Pressable
                 
                  onPress={(event) => {
                    onDismiss();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-semibold text-red-300/70"
                >
                  <Trash2 size={12} />
                  <Text>Supprimer</Text></Pressable>
              </View>
            )}
          </>
        </View>

        {notification.actionPage && (
          <ChevronRight
            size={14}
            className="absolute bottom-3.5 right-3.5 text-white/15"
          />
        )}
      </Pressable>
    </View>
  );
}

function EmptyState({ filtered }: { filtered: NotificationItem[] }) {
  const reducedMotion = useReducedMotion();

  return (
    <View
      className="flex flex-col items-center justify-center px-8 py-20 text-center"
    >
      <View
        className="relative flex h-20 w-20 items-center justify-center rounded-[1.75rem] border"
        style={{ borderColor: "rgba(139,92,246,.12)" }}
      >
        <BellOff size={28} className="text-white/20" />

        <Text className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#0B0B18] bg-violet-500/20">
          <Sparkles size={9} className="text-violet-300" />
        </Text>
      </View>

      <Text className="mt-5 text-sm font-bold text-white/70">
        {filtered.length === 0 ? "Rien à afficher ici" : "Tout est à jour"}
      </Text>

      <Text className="mt-1.5 max-w-xs text-[11px] leading-relaxed text-white/30">
        Les nouvelles activités, messages, opportunités et alertes apparaîtront
        automatiquement ici.
      </Text>
    </View>
  );
}

export default function NotificationCenter({ onClose, onNavigate }: Props) {
  const {
    notifs: rawNotifications,
    unreadTotal,
    markRead,
    markAllRead,
    dismiss,
  } = useNotifications();

  const reducedMotion = useReducedMotion();

  const [filterId, setFilterId] = useState<string>("all");

  const [showRead, setShowRead] = useState(true);

  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const panelRef = useRef<View>(null);

  const notifications = useMemo(
    () =>
      rawNotifications.map(normalizeNotification).sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }

        if (Boolean(a.read) !== Boolean(b.read)) {
          return a.read ? 1 : -1;
        }

        return b.timestamp - a.timestamp;
      }),
    [rawNotifications],
  );

  const activeFilter = FILTERS.find((filter) => filter.id === filterId);

  const filteredNotifications = useMemo(() => {
    const types = activeFilter?.types ?? null;

    return notifications.filter((notification) => {
      if (!showRead && notification.read) {
        return false;
      }

      if (types && !types.includes(notification.type)) {
        return false;
      }

      return true;
    });
  }, [activeFilter, notifications, showRead]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const filter of FILTERS) {
      const types = filter.types;

      counts[filter.id] = notifications.filter((notification) => {
        if (notification.read) {
          return false;
        }

        if (!types) {
          return true;
        }

        return types.includes(notification.type);
      }).length;
    }

    return counts;
  }, [notifications]);

  useEffect(() => {
    const previousOverflow = undefined.style.overflow;

    undefined.style.overflow = "hidden";

    return () => {
      undefined.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    undefined;

    return () => {
      undefined;
    };
  }, [onClose]);

  const handleMarkAllRead = async () => {
    if (unreadTotal === 0 || isMarkingAll) {
      return;
    }

    setIsMarkingAll(true);

    try {
      await Promise.resolve(markAllRead());
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <Pressable
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      style={{ backgroundColor: "rgba(0,0,0,.72)" }}
      onPress={onClose}
    >
      <Pressable
        ref={panelRef}
        className="relative flex w-full flex-col overflow-hidden rounded-t-[2rem] border sm:max-w-xl sm:rounded-[2rem]"
        style={{ maxHeight: "min(92vh, 860px)", borderColor: "rgba(255,255,255,.08)" }}
        onPress={(event) => event.stopPropagation()}
      >
        {/* Ambient light */}
        <View
          className="absolute -right-32 -top-32 h-72 w-72 rounded-full"
          style={{  }}
        />

        {/* Handle */}
        <View className="relative flex justify-center pb-1 pt-3 sm:hidden">
          <View className="h-1 w-10 rounded-full bg-white/15" />
        </View>

        {/* Header */}
        <View className="relative flex items-center justify-between px-5 pb-3 pt-3">
          <View className="min-w-0">
            <View className="flex items-center gap-2.5">
              <View
                className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                style={{ borderColor: "rgba(139,92,246,.18)" }}
              >
                <Bell size={18} className="text-violet-300" />
              </View>

              <View>
                <Text className="text-base font-black text-white">
                  Notifications
                </Text>

                <Text className="mt-0.5 text-[10px] text-white/30">
                  Votre activité en temps réel
                </Text>
              </View>

              {unreadTotal > 0 && (
                <Text
                  key={unreadTotal}
                  className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[10px] font-black text-white"
                  style={{  }}
                >
                  {unreadTotal > 99 ? "99+" : unreadTotal}
                </Text>
              )}
            </View>
          </View>

          <View className="flex items-center gap-2">
            {unreadTotal > 0 && (
              <Pressable
               
                disabled={isMarkingAll}
                onPress={handleMarkAllRead}
                className="flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-bold disabled:opacity-50"
                style={{ backgroundColor: "rgba(139,92,246,.08)", borderColor: "rgba(139,92,246,.16)" }}
              >
                {isMarkingAll ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <CheckCheck size={12} />
                )}

                <Text className="hidden xs:inline">Tout lire</Text>
              </Pressable>
            )}

            <Pressable
             
              accessibilityLabel="Fermer les notifications"
              onPress={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border text-white/45"
              style={{ backgroundColor: "rgba(255,255,255,.035)", borderColor: "rgba(255,255,255,.07)" }}
            >
              <X size={16} />
            </Pressable>
          </View>
        </View>

        {/* Quick status */}
        <View
          className="relative mx-4 mb-3 flex items-center justify-between rounded-2xl border px-3 py-2.5"
          style={{ backgroundColor: "rgba(255,255,255,.025)", borderColor: "rgba(255,255,255,.055)" }}
        >
          <View className="flex items-center gap-2">
            <Text className="relative flex h-2 w-2">
              <Text className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
              <Text className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </Text>

            <Text className="text-[10px] font-semibold text-white/45">
              <Text>Synchronisé en temps réel</Text></Text>
          </View>

          <Pressable
            type="button"
            onPress={() => setShowRead((value) => !value)}
            className="text-[10px] font-bold text-violet-300/70"
          >
            {showRead ? "Masquer les lues" : "Afficher les lues"}
          </Pressable>
        </View>

        {/* Filters */}
        <View
          className="relative flex gap-2 overflow-x-auto px-4 pb-3"
          style={{  }}
        >
          {FILTERS.map((filter) => {
            const active = filter.id === filterId;
            const count = filterCounts[filter.id] ?? 0;

            return (
              <Pressable
                key={filter.id}
                type="button"
                onPress={() => setFilterId(filter.id)}
                className="relative flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[10px] font-bold"
                style={{ backgroundColor: active
                                    ? "rgba(139,92,246,.14)"
                                    : "rgba(255,255,255,.035)", borderColor: active
                                    ? "rgba(139,92,246,.25)"
                                    : "rgba(255,255,255,.06)" }}
              >
                {filter.label}

                {count > 0 && (
                  <Text
                    className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black text-white"
                    style={{ backgroundColor: active ? "#7C3AED" : "rgba(255,255,255,.10)" }}
                  >
                    {count > 99 ? "99+" : count}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Notification list */}
        <View
          className="relative flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          style={{  }}
        >
          <>
            {filteredNotifications.length === 0 ? (
              <EmptyState filtered={filteredNotifications} />
            ) : (
              <View className="flex flex-col gap-2">
                {filteredNotifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onMarkRead={() => markRead(notification.id)}
                    onDismiss={() => dismiss(notification.id)}
                    onNavigate={(page) => {
                      onClose();
                      onNavigate(page);
                    }}
                  />
                ))}
              </View>
            )}
          </>
        </View>

        {/* Bottom fade */}
        <View
          className="absolute bottom-0 left-0 right-0 h-8"
          style={{  }}
        />
      </Pressable>
    </Pressable>
  );
}
