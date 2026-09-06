import { View, Pressable, Text, Image } from "react-native";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Home,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  TrendingUp,
  UserRound,
  WalletCards,
  Zap,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface HomeCommandItem {
  id?: string;
  _id?: string;

  title?: string;
  content?: string;
  description?: string;

  moduleId?: string;
  module?: string;
  type?: string;

  route?: string;

  city?: string;
  location?: string;

  authorName?: string;
  authorAvatar?: string;

  imageUrl?: string;
  coverUrl?: string;

  score?: number;
  finalScore?: number;

  createdAt?: number;
  _creationTime?: number;

  unread?: boolean;
  urgent?: boolean;
  featured?: boolean;

  [key: string]: unknown;
}

export interface HomeCommandModule {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: string;
  route: string;
  priority?: number;
}

interface HomeCommandCenterProps {
  userName?: string;
  city?: string;

  items?: HomeCommandItem[];

  modules?: HomeCommandModule[];

  notificationCount?: number;
  messageCount?: number;

  streak?: number;

  onNavigate: (page: string) => void;

  onSearch?: () => void;

  onNotifications?: () => void;

  onMessages?: () => void;

  onCreate?: () => void;

  onOpenItem?: (item: HomeCommandItem) => void;

  onSettings?: () => void;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const MODULES: Record<
  string,
  {
    label: string;
    color: string;
    icon: typeof Sparkles;
    route: string;
  }
> = {
  jobs: {
    label: "Jobs",
    color: "#8B5CF6",
    icon: BriefcaseBusiness,
    route: "jobs",
  },

  immo: {
    label: "Immo",
    color: "#F97316",
    icon: Home,
    route: "immo",
  },

  evenements: {
    label: "Événements",
    color: "#EC4899",
    icon: CalendarDays,
    route: "evenements",
  },

  events: {
    label: "Événements",
    color: "#EC4899",
    icon: CalendarDays,
    route: "evenements",
  },

  pay: {
    label: "Pay",
    color: "#10B981",
    icon: WalletCards,
    route: "pay",
  },

  community: {
    label: "Communauté",
    color: "#A855F7",
    icon: UserRound,
    route: "community",
  },

  voyages: {
    label: "Voyages",
    color: "#6366F1",
    icon: Compass,
    route: "voyages",
  },

  transport: {
    label: "Transport",
    color: "#3B82F6",
    icon: Navigation,
    route: "transport",
  },

  live: {
    label: "Live",
    color: "#EF4444",
    icon: Zap,
    route: "live",
  },

  boutique: {
    label: "Boutique",
    color: "#EC4899",
    icon: WalletCards,
    route: "boutique",
  },

  sante: {
    label: "Santé",
    color: "#EF4444",
    icon: Sparkles,
    route: "sante",
  },

  education: {
    label: "Éducation",
    color: "#06B6D4",
    icon: Sparkles,
    route: "education",
  },

  agri: {
    label: "Agriculture",
    color: "#22C55E",
    icon: TrendingUp,
    route: "agri",
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getMeta(item: HomeCommandItem) {
  const key = String(item.moduleId ?? item.module ?? "").toLowerCase();

  return (
    MODULES[key] ?? {
      label: "Pour vous",
      color: "#6366F1",
      icon: Sparkles,
      route: item.route ?? key ?? "home",
    }
  );
}

function getTimestamp(item: HomeCommandItem) {
  return item.createdAt ?? item._creationTime ?? 0;
}

function cleanText(value?: string) {
  return (
    value
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function getTitle(item: HomeCommandItem) {
  return (
    item.title ||
    cleanText(item.description) ||
    cleanText(item.content).slice(0, 100) ||
    "Nouveauté pour vous"
  );
}

function relativeTime(timestamp: number) {
  if (!timestamp) {
    return "Maintenant";
  }

  const diff = Date.now() - timestamp;

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "À l'instant";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Hier";
  }

  return `${days} j`;
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Bonjour";
  }

  if (hour < 18) {
    return "Bon après-midi";
  }

  return "Bonsoir";
}

/* ============================================================================
 * COMMAND HEADER
 * ========================================================================== */

function CommandHeader({
  userName,
  city,
  notificationCount,
  messageCount,
  onSearch,
  onNotifications,
  onMessages,
  onSettings,
}: {
  userName?: string;
  city?: string;
  notificationCount: number;
  messageCount: number;
  onSearch?: () => void;
  onNotifications?: () => void;
  onMessages?: () => void;
  onSettings?: () => void;
}) {
  const firstName = userName?.trim().split(/\s+/)[0] ?? "";

  return (
    <View
      className="px-5 pt-4"
    >
      <View className="flex items-center gap-3">
        {/* Avatar */}

        <View
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.09)", borderStyle: "solid" }}
        >
          <UserRound size={18} className="text-white/80" />

          <Text className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#08080c] bg-emerald-400" />
        </View>

        {/* Greeting */}

        <View className="min-w-0 flex-1">
          <Text className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
            {greeting()}
          </Text>

          <Text className="truncate text-[17px] font-black tracking-[-0.03em] text-white">
            {firstName || "Bienvenue"}
            {firstName ? "." : ""}
          </Text>

          {city && (
            <View className="mt-0.5 flex items-center gap-1">
              <MapPin size={8} className="text-cyan-300" />

              <Text className="truncate text-[8px] text-white/30">{city}</Text>
            </View>
          )}
        </View>

        {/* Actions */}

        <View className="flex items-center gap-1.5">
          <HeaderButton icon={Search} onPress={onSearch} />

          <HeaderButton
            icon={Bell}
            badge={notificationCount}
            onPress={onNotifications}
          />

          <HeaderButton
            icon={MessageCircle}
            badge={messageCount}
            onPress={onMessages}
          />

          <HeaderButton icon={Settings2} onPress={onSettings} />
        </View>
      </View>
    </View>
  );
}

function HeaderButton({
  icon: Icon,
  badge,
  onClick,
}: {
  icon: typeof Search;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Pressable
     
      onPress={onClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/45"
      style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.055)", borderStyle: "solid" }}
    >
      <Icon size={14} />

      {!!badge && badge > 0 && (
        <Text
          className="absolute -right-1 -top-1 flex min-w-[15px] items-center justify-center rounded-full px-1 text-[7px] font-black text-white"
          style={{ height: 15, borderWidth: 2, borderColor: "#08080c", borderStyle: "solid" }}
        >
          {badge > 99 ? "99+" : badge}
        </Text>
      )}
    </Pressable>
  );
}

/* ============================================================================
 * COMMAND BAR
 * ========================================================================== */

function QuickCommandBar({
  onSearch,
  onCreate,
}: {
  onSearch?: () => void;
  onCreate?: () => void;
}) {
  return (
    <View
      className="mt-4 px-5"
    >
      <View className="flex gap-2">
        <Pressable
         
          onPress={onSearch}
          className="group flex h-11 flex-1 items-center gap-3 rounded-[18px] px-3.5 text-left"
          style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
        >
          <Search size={15} className="text-white/30" />

          <Text className="flex-1 text-[10px] font-medium text-white/25">
            Que cherchez-vous ?
          </Text>

          <Text
            className="rounded-lg px-2 py-1 text-[7px] font-bold text-white/20"
            style={{ backgroundColor: "rgba(255,255,255,.04)" }}
          >
            Rechercher
          </Text>
        </Pressable>

        <Pressable
         
          onPress={onCreate}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] text-white"
          style={{  }}
          accessibilityLabel="Créer"
        >
          <Plus size={17} />
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * COMMAND STRIP
 * ========================================================================== */

function CommandStrip({
  streak,
  items,
  onNavigate,
}: {
  streak: number;
  items: HomeCommandItem[];
  onNavigate: (page: string) => void;
}) {
  const nearby = items.find((item) => !!item.city || !!item.location);

  return (
    <View
      className="mt-3 flex gap-2 overflow-x-auto px-5 pb-1"
      style={{  }}
    >
      <CommandPill
        icon={Flame}
        label={
          streak > 0 ? `${streak} jour${streak > 1 ? "s" : ""}` : "Commencer"
        }
        accent="#F97316"
        onPress={() => onNavigate("profile")}
      />

      <CommandPill
        icon={Sparkles}
        label="Pour vous"
        accent="#8B5CF6"
        onPress={() => onNavigate("home")}
      />

      <CommandPill
        icon={MapPin}
        label={nearby ? "Près de vous" : "À proximité"}
        accent="#06B6D4"
        onPress={() => onNavigate("nearby")}
      />

      <CommandPill
        icon={TrendingUp}
        label="Tendances"
        accent="#10B981"
        onPress={() => onNavigate("community")}
      />
    </View>
  );
}

function CommandPill({
  icon: Icon,
  label,
  accent,
  onClick,
}: {
  icon: typeof Flame;
  label: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <Pressable
     
      onPress={onClick}
      className="flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-[9px] font-bold text-white/55"
      style={{ backgroundColor: `${accent}0D`, borderStyle: "solid" }}
    >
      <Icon
        size={11}
        style={{
          color: accent,
        }}
      />

      {label}
    </Pressable>
  );
}

/* ============================================================================
 * PRIORITY PANEL
 * ========================================================================== */

function PriorityPanel({
  items,
  onOpenItem,
  onNavigate,
}: {
  items: HomeCommandItem[];
  onOpenItem?: (item: HomeCommandItem) => void;
  onNavigate: (page: string) => void;
}) {
  const priority = items[0];

  if (!priority) {
    return null;
  }

  const meta = getMeta(priority);

  const Icon = meta.icon;

  const title = getTitle(priority);

  const image =
    typeof priority.imageUrl === "string"
      ? priority.imageUrl
      : typeof priority.coverUrl === "string"
        ? priority.coverUrl
        : undefined;

  const open = () => {
    if (onOpenItem) {
      onOpenItem(priority);
      return;
    }

    onNavigate(meta.route);
  };

  return (
    <View
      className="mx-5 mt-4"
    >
      <View
        className="relative min-h-[145px] overflow-hidden rounded-[28px]"
        style={{ borderWidth: 1, borderColor: "rgba(165,180,252,.12)", borderStyle: "solid" }}
      >
        {image && (
          <Image
           
           
            className="absolute inset-0 h-full w-full object-cover opacity-25"
            loading="lazy"
           source={{ uri: image }} accessibilityLabel=""/>
        )}

        <View
          className="absolute inset-0"
          style={{  }}
        />

        <View
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full"
          style={{  }}
        />

        <Pressable
         
          onPress={open}
          className="relative flex h-full min-h-[145px] w-full flex-col justify-between p-4 text-left"
        >
          <View className="flex items-center gap-2">
            <View
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${meta.color}18`, borderStyle: "solid" }}
            >
              <Icon
                size={14}
                style={{
                  color: meta.color,
                }}
              />
            </View>

            <View>
              <View className="flex items-center gap-1.5">
                <Text
                  className="text-[8px] font-black uppercase tracking-[.16em]"
                  style={{
                    color: meta.color,
                  }}
                >
                  Priorité
                </Text>

                <Text className="text-[7px] text-white/25">•</Text>

                <Text className="text-[7px] text-white/25">
                  {relativeTime(getTimestamp(priority))}
                </Text>
              </View>

              <Text className="mt-0.5 text-[8px] font-semibold text-white/35">
                Recommandé pour vous
              </Text>
            </View>
          </View>

          <View className="mt-3">
            <Text className="max-w-[82%] text-[17px] font-black leading-[1.12] tracking-[-.03em] text-white">
              {title}
            </Text>

            <View className="mt-3 flex items-center gap-2">
              <Text
                className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[8px] font-bold text-white"
                style={{ backgroundColor: `${meta.color}22`, borderStyle: "solid" }}
              >
                Découvrir
                <ArrowRight size={9} />
              </Text>

              {priority.city && (
                <Text className="flex items-center gap-1 text-[8px] text-white/30">
                  <MapPin size={8} />
                  {priority.city}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * MODULE COMMAND GRID
 * ========================================================================== */

function ModuleCommandGrid({
  modules,
  onNavigate,
}: {
  modules: HomeCommandModule[];
  onNavigate: (page: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? modules : modules.slice(0, 8);

  if (!visible.length) {
    return null;
  }

  return (
    <View
      className="mt-5 px-5"
    >
      <SectionHeader
        title="Votre univers"
        subtitle="Tout DébrouillePro, en un geste"
        action={
          modules.length > 8 ? (expanded ? "Réduire" : "Tout voir") : undefined
        }
        onAction={() => setExpanded((value) => !value)}
      />

      <View className="mt-3 gap-2">
        {visible.map((module, index) => {
          const meta = MODULES[module.id] ?? {
            label: module.label,
            color: "#6366F1",
            icon: Sparkles,
            route: module.route,
          };

          const Icon = meta.icon;

          return (
            <Pressable
              key={module.id}
              type="button"
              onPress={() => onNavigate(meta.route)}
              className="group flex flex-col items-center gap-2 rounded-[20px] p-3"
              style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.045)", borderStyle: "solid" }}
            >
              <View
                className="flex h-10 w-10 items-center justify-center rounded-[15px]"
                style={{ backgroundColor: `${meta.color}12`, borderStyle: "solid" }}
              >
                <Icon
                  size={16}
                  style={{
                    color: meta.color,
                  }}
                />
              </View>

              <Text className="w-full text-center text-[8px] font-bold text-white/45">
                {module.shortLabel || meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ============================================================================
 * DAILY COMMANDS
 * ========================================================================== */

function DailyActions({
  items,
  onNavigate,
}: {
  items: HomeCommandItem[];
  onNavigate: (page: string) => void;
}) {
  const actions = useMemo(() => {
    const result: Array<{
      id: string;
      icon: typeof BriefcaseBusiness;
      title: string;
      subtitle: string;
      color: string;
      route: string;
    }> = [];

    const hasJobs = items.some(
      (item) =>
        String(item.moduleId ?? item.module ?? "").toLowerCase() === "jobs",
    );

    const hasImmo = items.some(
      (item) =>
        String(item.moduleId ?? item.module ?? "").toLowerCase() === "immo",
    );

    if (hasJobs) {
      result.push({
        id: "jobs",
        icon: BriefcaseBusiness,
        title: "Opportunités pro",
        subtitle: "Voir les nouvelles offres",
        color: "#8B5CF6",
        route: "jobs",
      });
    }

    if (hasImmo) {
      result.push({
        id: "immo",
        icon: Home,
        title: "Immobilier",
        subtitle: "Découvrir les annonces",
        color: "#F97316",
        route: "immo",
      });
    }

    result.push({
      id: "events",
      icon: CalendarDays,
      title: "Que faire aujourd'hui ?",
      subtitle: "Explorer les événements",
      color: "#EC4899",
      route: "evenements",
    });

    result.push({
      id: "nearby",
      icon: MapPin,
      title: "Autour de moi",
      subtitle: "Voir ce qui est proche",
      color: "#06B6D4",
      route: "nearby",
    });

    return result.slice(0, 4);
  }, [items]);

  return (
    <View
      className="mt-5 px-5"
    >
      <SectionHeader
        title="À faire maintenant"
        subtitle="Des raccourcis qui ont du sens"
      />

      <View className="mt-3 space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <Pressable
              key={action.id}
              type="button"
              onPress={() => onNavigate(action.route)}
              className="flex w-full items-center gap-3 rounded-[20px] p-3 text-left"
              style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.045)", borderStyle: "solid" }}
            >
              <View
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]"
                style={{ backgroundColor: `${action.color}12`, borderStyle: "solid" }}
              >
                <Icon
                  size={15}
                  style={{
                    color: action.color,
                  }}
                />
              </View>

              <View className="min-w-0 flex-1">
                <Text className="text-[10px] font-bold text-white/75">
                  {action.title}
                </Text>

                <Text className="mt-0.5 text-[8px] text-white/25">
                  {action.subtitle}
                </Text>
              </View>

              <ChevronRight size={13} className="text-white/20" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ============================================================================
 * INSIGHT STRIP
 * ========================================================================== */

function InsightStrip({
  items,
  onNavigate,
}: {
  items: HomeCommandItem[];
  onNavigate: (page: string) => void;
}) {
  const moduleCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of items) {
      const key = String(item.moduleId ?? item.module ?? "other");

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const top = moduleCounts[0];

  if (!top) {
    return null;
  }

  const meta = MODULES[top[0]];

  return (
    <Pressable
      type="button"
      onPress={() => onNavigate(meta?.route ?? top[0])}
      className="mx-5 mt-5 flex w-[calc(100%-40px)] items-center gap-3 rounded-[22px] p-3.5 text-left"
      style={{ borderWidth: 1, borderColor: "rgba(16,185,129,.12)", borderStyle: "solid" }}
    >
      <View
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "rgba(16,185,129,.11)" }}
      >
        <TrendingUp size={15} className="text-emerald-300" />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-[8px] font-black uppercase tracking-[.14em] text-emerald-300/70">
          Votre tendance
        </Text>

        <Text className="mt-1 truncate text-[10px] font-bold text-white/70">
          {meta?.label ?? "Un univers"} attire particulièrement votre attention.
        </Text>
      </View>

      <ArrowRight size={13} className="text-emerald-300/50" />
    </Pressable>
  );
}

/* ============================================================================
 * SECTION HEADER
 * ========================================================================== */

function SectionHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex items-end gap-3">
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] font-black tracking-[-.02em] text-white/85">
          {title}
        </Text>

        {subtitle && (
          <Text className="mt-0.5 text-[8px] text-white/25">{subtitle}</Text>
        )}
      </View>

      {action && (
        <Pressable
         
          onPress={onAction}
          className="text-[8px] font-bold text-indigo-300/70"
        >
          {action}
        </Pressable>
      )}
    </View>
  );
}

/* ============================================================================
 * RECENTLY VISITED
 * ========================================================================== */

function RecentModules({
  modules,
  onNavigate,
}: {
  modules: HomeCommandModule[];
  onNavigate: (page: string) => void;
}) {
  const recent = modules.slice(0, 5);

  if (!recent.length) {
    return null;
  }

  return (
    <View
      className="mt-5"
    >
      <View className="mb-2 flex items-center gap-1.5 px-5">
        <Clock3 size={10} className="text-white/25" />

        <Text className="text-[8px] font-bold uppercase tracking-[.14em] text-white/25">
          Accès rapide
        </Text>
      </View>

      <View
        className="flex gap-2 overflow-x-auto px-5 pb-1"
        style={{  }}
      >
        {recent.map((module) => {
          const meta = MODULES[module.id] ?? {
            label: module.label,
            color: "#6366F1",
            icon: Sparkles,
            route: module.route,
          };

          const Icon = meta.icon;

          return (
            <Pressable
              key={module.id}
             
              onPress={() => onNavigate(meta.route)}
              className="flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2"
              style={{ backgroundColor: `${meta.color}0D`, borderStyle: "solid" }}
            >
              <Icon
                size={10}
                style={{
                  color: meta.color,
                }}
              />

              <Text className="text-[8px] font-bold text-white/45">
                {module.shortLabel || meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ============================================================================
 * EMPTY COMMAND CENTER
 * ========================================================================== */

function EmptyCommandCenter({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return (
    <View
      className="mx-5 mt-4 rounded-[28px] p-5"
      style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
    >
      <View className="flex items-center gap-3">
        <View
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: "rgba(99,102,241,.13)" }}
        >
          <Sparkles size={18} className="text-indigo-300" />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-[12px] font-black text-white">
            Votre espace est prêt.
          </Text>

          <Text className="mt-1 text-[9px] leading-relaxed text-white/30">
            Explorez les modules et commencez à construire votre expérience
            personnalisée.
          </Text>
        </View>
      </View>

      <Pressable
       
        onPress={() => onNavigate("community")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-[10px] font-bold text-white"
        style={{  }}
      >
        <Text>Explorer DébrouillePro</Text><ArrowRight size={12} />
      </Pressable>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function HomeCommandCenter({
  userName,
  city,
  items = [],
  modules = [],
  notificationCount = 0,
  messageCount = 0,
  streak = 0,
  onNavigate,
  onSearch,
  onNotifications,
  onMessages,
  onCreate,
  onOpenItem,
  onSettings,
}: HomeCommandCenterProps) {
  const [showAll, setShowAll] = useState(false);

  const cleanItems = useMemo(() => {
    const seen = new Set<string>();

    return [...items]
      .filter(Boolean)
      .sort(
        (a, b) =>
          (b.finalScore ?? b.score ?? 0) - (a.finalScore ?? a.score ?? 0),
      )
      .filter((item) => {
        const key = String(item._id ?? item.id ?? getTitle(item));

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      });
  }, [items]);

  const visibleItems = showAll ? cleanItems : cleanItems.slice(0, 6);

  return (
    <View
      className="relative flex flex-col pb-6"
      style={{  }}
    >
      {/* ======================================================================
          HEADER
         ==================================================================== */}

      <CommandHeader
        userName={userName}
        city={city}
        notificationCount={notificationCount}
        messageCount={messageCount}
        onSearch={onSearch}
        onNotifications={onNotifications}
        onMessages={onMessages}
        onSettings={onSettings}
      />

      {/* ======================================================================
          SEARCH / COMMAND BAR
         ==================================================================== */}

      <QuickCommandBar onSearch={onSearch} onCreate={onCreate} />

      {/* ======================================================================
          QUICK COMMANDS
         ==================================================================== */}

      <CommandStrip
        streak={streak}
        items={cleanItems}
        onNavigate={onNavigate}
      />

      {/* ======================================================================
          PRIORITY
         ==================================================================== */}

      {cleanItems.length > 0 ? (
        <PriorityPanel
          items={cleanItems}
          onOpenItem={onOpenItem}
          onNavigate={onNavigate}
        />
      ) : (
        <EmptyCommandCenter onNavigate={onNavigate} />
      )}

      {/* ======================================================================
          MODULE UNIVERSE
         ==================================================================== */}

      <ModuleCommandGrid modules={modules} onNavigate={onNavigate} />

      {/* ======================================================================
          DAILY ACTIONS
         ==================================================================== */}

      <DailyActions items={cleanItems} onNavigate={onNavigate} />

      {/* ======================================================================
          INSIGHT
         ==================================================================== */}

      <InsightStrip items={cleanItems} onNavigate={onNavigate} />

      {/* ======================================================================
          FEED PREVIEW
         ==================================================================== */}

      {cleanItems.length > 1 && (
        <View
          className="mt-5 px-5"
        >
          <SectionHeader
            title="Votre sélection"
            subtitle="Le meilleur de votre espace"
            action={
              cleanItems.length > 6
                ? showAll
                  ? "Réduire"
                  : "Tout voir"
                : undefined
            }
            onAction={() => setShowAll((value) => !value)}
          />

          <View className="mt-3 space-y-2">
            <>
              {visibleItems.slice(1).map((item, index) => {
                const meta = getMeta(item);

                const Icon = meta.icon;

                return (
                  <Pressable
                    key={String(item._id ?? item.id ?? index)}
                    type="button"
                    onPress={() => {
                      if (onOpenItem) {
                        onOpenItem(item);
                      } else {
                        onNavigate(meta.route);
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-[20px] p-3 text-left"
                    style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.045)", borderStyle: "solid" }}
                  >
                    <View
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${meta.color}10` }}
                    >
                      <Icon
                        size={14}
                        style={{
                          color: meta.color,
                        }}
                      />
                    </View>

                    <View className="min-w-0 flex-1">
                      <View className="flex items-center gap-1.5">
                        <Text
                          className="text-[7px] font-black uppercase tracking-wider"
                          style={{
                            color: meta.color,
                          }}
                        >
                          {meta.label}
                        </Text>

                        <Text className="text-[7px] text-white/20"><Text>•</Text></Text>

                        <Text className="text-[7px] text-white/20">
                          {relativeTime(getTimestamp(item))}
                        </Text>
                      </View>

                      <Text className="mt-1 text-[10px] font-bold text-white/65">
                        {getTitle(item)}
                      </Text>
                    </View>

                    <ChevronRight size={12} className="text-white/20" />
                  </Pressable>
                );
              })}
            </>
          </View>
        </View>
      )}

      {/* ======================================================================
          RECENT
         ==================================================================== */}

      <RecentModules modules={modules} onNavigate={onNavigate} />

      {/* ======================================================================
          FOOTER STATUS
         ==================================================================== */}

      <View
        className="mt-6 flex items-center justify-center gap-2 px-5"
      >
        <Text
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
         
        />

        <Text className="text-[7px] font-bold uppercase tracking-[.16em] text-white/20">
          <Text>DébrouillePro · Votre espace évolue avec vous</Text></Text>
      </View>
    </View>
  );
}
