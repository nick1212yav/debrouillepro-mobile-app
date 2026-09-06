import { View, Pressable, Text, Image } from "react-native";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Clock3,
  Flame,
  HeartPulse,
  Home,
  MapPin,
  Newspaper,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react-native";
import { useMemo, useState } from "react";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface DailyBriefItem {
  id?: string;
  _id?: string;

  title?: string;
  content?: string;
  description?: string;

  moduleId?: string;
  module?: string;
  type?: string;

  authorName?: string;
  authorAvatar?: string;

  city?: string;
  location?: string;

  createdAt?: number;
  _creationTime?: number;

  imageUrl?: string;
  coverUrl?: string;

  score?: number;
  finalScore?: number;

  [key: string]: unknown;
}

interface DailyBriefProps {
  items?: DailyBriefItem[];

  userName?: string;

  city?: string;

  onNavigate: (page: string) => void;

  onOpenItem?: (item: DailyBriefItem) => void;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const MAX_ITEMS = 4;

const MODULE_META: Record<
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
    label: "Immobilier",
    color: "#F97316",
    icon: Home,
    route: "immo",
  },

  annonces: {
    label: "Annonces",
    color: "#F59E0B",
    icon: Newspaper,
    route: "annonces",
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
    icon: HeartPulse,
    route: "sante",
  },

  health: {
    label: "Santé",
    color: "#EF4444",
    icon: HeartPulse,
    route: "sante",
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

  community: {
    label: "Communauté",
    color: "#A855F7",
    icon: Users,
    route: "community",
  },

  transport: {
    label: "Transport",
    color: "#3B82F6",
    icon: MapPin,
    route: "transport",
  },

  agri: {
    label: "Agriculture",
    color: "#22C55E",
    icon: TrendingUp,
    route: "agri",
  },

  agriculture: {
    label: "Agriculture",
    color: "#22C55E",
    icon: TrendingUp,
    route: "agri",
  },

  media: {
    label: "Actualités",
    color: "#06B6D4",
    icon: Newspaper,
    route: "media",
  },

  live: {
    label: "Live",
    color: "#EF4444",
    icon: Zap,
    route: "live",
  },

  voyages: {
    label: "Voyages",
    color: "#6366F1",
    icon: MapPin,
    route: "voyages",
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getModuleKey(item: DailyBriefItem): string {
  return String(item.moduleId ?? item.module ?? "").toLowerCase();
}

function getModuleMeta(item: DailyBriefItem) {
  const key = getModuleKey(item);

  return (
    MODULE_META[key] ?? {
      label: "Pour vous",
      color: "#06B6D4",
      icon: Sparkles,
      route: key || "home",
    }
  );
}

function getItemTitle(item: DailyBriefItem): string {
  return (
    item.title?.trim() ||
    item.description?.trim() ||
    item.content
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100) ||
    "Une nouveauté pour vous"
  );
}

function getItemDescription(item: DailyBriefItem): string {
  const source = item.description ?? item.content ?? "";

  const clean = source
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return clean.length > 120 ? `${clean.slice(0, 117)}…` : clean;
}

function getTimestamp(item: DailyBriefItem): number {
  return item.createdAt ?? item._creationTime ?? 0;
}

function relativeTime(timestamp: number): string {
  if (!timestamp) {
    return "Récemment";
  }

  const diff = Date.now() - timestamp;

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "À l'instant";
  }

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
    day: "numeric",
    month: "short",
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) {
    return "Bonne nuit";
  }

  if (hour < 12) {
    return "Bonjour";
  }

  if (hour < 18) {
    return "Bon après-midi";
  }

  return "Bonsoir";
}

/* ============================================================================
 * SMART SUMMARY
 * ========================================================================== */

function buildSummary(items: DailyBriefItem[]): {
  total: number;
  moduleCount: number;
  newestModule?: string;
  newestLabel?: string;
} {
  const modules = new Set<string>();

  for (const item of items) {
    const key = getModuleKey(item);

    if (key) {
      modules.add(key);
    }
  }

  const newest = [...items].sort(
    (a, b) => getTimestamp(b) - getTimestamp(a),
  )[0];

  if (!newest) {
    return {
      total: 0,
      moduleCount: modules.size,
    };
  }

  const meta = getModuleMeta(newest);

  return {
    total: items.length,
    moduleCount: modules.size,
    newestModule: getModuleKey(newest),
    newestLabel: meta.label,
  };
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function DailyBriefSkeleton() {
  return (
    <View className="mx-5 mt-4">
      <View
        className="overflow-hidden rounded-[32px] p-4"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-3">
          <View
            className="h-12 w-12 animate-pulse rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,.07)" }}
          />

          <View className="flex-1 space-y-2">
            <View
              className="h-3 w-32 animate-pulse rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,.08)" }}
            />

            <View
              className="h-2.5 w-52 animate-pulse rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,.05)" }}
            />
          </View>
        </View>

        <View className="mt-4 space-y-2">
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              className="h-16 animate-pulse rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,.045)" }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * EMPTY
 * ========================================================================== */

function DailyBriefEmpty({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  return (
    <View
      className="mx-5 mt-4"
    >
      <View
        className="relative overflow-hidden rounded-[32px] p-5"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
      >
        <View
          className="absolute -right-16 -top-16 h-40 w-40 rounded-full"
          style={{  }}
        />

        <View className="relative flex items-center gap-4">
          <View
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(99,102,241,.14)", borderWidth: 1, borderColor: "rgba(129,140,248,.18)", borderStyle: "solid" }}
          >
            <Sparkles size={20} className="text-indigo-300" />
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-[13px] font-bold text-white">
              Votre DailyBrief se prépare
            </Text>

            <Text className="mt-1 text-[9px] leading-relaxed text-white/35">
              Dès que votre espace contient des nouveautés, nous vous montrerons
              l’essentiel ici.
            </Text>
          </View>

          <Pressable
           
            onPress={() => onNavigate("community")}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40"
            style={{ backgroundColor: "rgba(255,255,255,.05)" }}
          >
            <ArrowRight size={14} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * ITEM
 * ========================================================================== */

function BriefItem({
  item,
  index,
  onNavigate,
  onOpenItem,
}: {
  item: DailyBriefItem;
  index: number;
  onNavigate: (page: string) => void;
  onOpenItem?: (item: DailyBriefItem) => void;
}) {
  const meta = getModuleMeta(item);

  const Icon = meta.icon;

  const title = getItemTitle(item);

  const description = getItemDescription(item);

  const hasImage =
    typeof item.imageUrl === "string" || typeof item.coverUrl === "string";

  const image =
    typeof item.imageUrl === "string"
      ? item.imageUrl
      : typeof item.coverUrl === "string"
        ? item.coverUrl
        : undefined;

  const handleClick = () => {
    if (onOpenItem) {
      onOpenItem(item);
      return;
    }

    if (meta.route) {
      onNavigate(meta.route);
    }
  };

  return (
    <Pressable
      type="button"
      onPress={handleClick}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[22px] p-3 text-left"
      style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.055)", borderStyle: "solid" }}
    >
      {/* Accent */}
      <View
        className="absolute bottom-0 left-0 top-0 w-[2px]"
        style={{ backgroundColor: meta.color, opacity: 0.75 }}
      />

      {/* Image / Icon */}
      {hasImage && image ? (
        <View
          className="h-12 w-12 shrink-0 overflow-hidden rounded-[15px]"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
        >
          <Image
           
           
            className="h-full w-full object-cover"
            loading="lazy"
           source={{ uri: image }} accessibilityLabel=""/>
        </View>
      ) : (
        <View
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px]"
          style={{ backgroundColor: `${meta.color}12`, borderStyle: "solid" }}
        >
          <Icon
            size={18}
            style={{
              color: meta.color,
            }}
          />
        </View>
      )}

      {/* Content */}
      <View className="min-w-0 flex-1">
        <View className="flex items-center gap-1.5">
          <Text
            className="text-[8px] font-black uppercase tracking-[0.12em]"
            style={{
              color: meta.color,
            }}
          >
            {meta.label}
          </Text>

          <Text className="text-[8px] text-white/20">•</Text>

          <Text className="text-[8px] text-white/25">
            {relativeTime(getTimestamp(item))}
          </Text>
        </View>

        <Text className="mt-1 text-[11px] font-bold text-white">
          {title}
        </Text>

        {description && description !== title && (
          <Text className="mt-0.5 text-[9px] leading-relaxed text-white/30">
            {description}
          </Text>
        )}

        {item.city && (
          <View className="mt-1 flex items-center gap-1">
            <MapPin size={8} className="text-white/25" />

            <Text className="text-[8px] text-white/25">{item.city}</Text>
          </View>
        )}
      </View>

      {/* Arrow */}
      <View
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: "rgba(255,255,255,.04)" }}
      >
        <ChevronRight size={12} className="text-white/25" />
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function DailyBrief({
  items = [],
  userName,
  city,
  onNavigate,
  onOpenItem,
}: DailyBriefProps) {
  const [dismissed, setDismissed] = useState(false);

  const cleanItems = useMemo(() => {
    const seen = new Set<string>();

    return [...items]
      .filter(Boolean)
      .sort(
        (a, b) =>
          (b.finalScore ?? b.score ?? 0) - (a.finalScore ?? a.score ?? 0),
      )
      .filter((item) => {
        const key = String(item._id ?? item.id ?? getItemTitle(item));

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, MAX_ITEMS);
  }, [items]);

  const summary = useMemo(() => buildSummary(cleanItems), [cleanItems]);

  if (dismissed) {
    return null;
  }

  if (cleanItems.length === 0) {
    return <DailyBriefEmpty onNavigate={onNavigate} />;
  }

  const greeting = getGreeting();

  const firstName = userName?.trim().split(/\s+/)[0] ?? "";

  return (
    <View
      className="mx-5 mt-4"
      accessibilityLabel="DailyBrief"
    >
      <View
        className="relative overflow-hidden rounded-[32px]"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
      >
        {/* ====================================================================
            AMBIENT LIGHT
           ================================================================== */}

        <View
          className="absolute -right-20 -top-24 h-60 w-60 rounded-full"
          style={{  }}
        />

        <View
          className="absolute -bottom-28 -left-10 h-52 w-52 rounded-full"
          style={{  }}
        />

        {/* ====================================================================
            HEADER
           ================================================================== */}

        <View className="relative flex items-start gap-3 px-4 pb-3 pt-4">
          <View
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px]"
            style={{ borderWidth: 1, borderColor: "rgba(165,180,252,.18)", borderStyle: "solid" }}
          >
            <Sparkles size={20} className="text-indigo-200" strokeWidth={2} />

            <Text
              className="absolute inset-1 rounded-[15px]"
              style={{ borderWidth: 1, borderColor: "rgba(165,180,252,.35)", borderStyle: "solid" }}
            />
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex items-center gap-2">
              <Text className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-200">
                DailyBrief
              </Text>

              <Text
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
               
              />
            </View>

            <Text className="mt-1 text-[16px] font-black tracking-[-0.02em] text-white">
              {greeting}
              {firstName ? ` ${firstName}` : ""}.
            </Text>

            <Text className="mt-0.5 text-[9px] leading-relaxed text-white/35">
              Voici ce qui mérite votre attention aujourd’hui
              {city ? ` à ${city}` : ""}.
            </Text>
          </View>

          <Pressable
           
            onPress={() => setDismissed(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white/25"
            style={{ backgroundColor: "rgba(255,255,255,.04)" }}
            accessibilityLabel="Masquer DailyBrief"
          >
            <X size={12} />
          </Pressable>
        </View>

        {/* ====================================================================
            QUICK STATS
           ================================================================== */}

        <View className="relative gap-2 px-3 pb-3">
          <View
            className="rounded-2xl px-3 py-2"
            style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.05)", borderStyle: "solid" }}
          >
            <View className="flex items-center gap-1.5">
              <Bell size={10} className="text-indigo-300" />

              <Text className="text-[8px] font-bold uppercase tracking-wide text-white/25">
                À voir
              </Text>
            </View>

            <Text className="mt-1 text-[15px] font-black text-white">
              {summary.total}
            </Text>
          </View>

          <View
            className="rounded-2xl px-3 py-2"
            style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.05)", borderStyle: "solid" }}
          >
            <View className="flex items-center gap-1.5">
              <Flame size={10} className="text-orange-300" />

              <Text className="text-[8px] font-bold uppercase tracking-wide text-white/25">
                Tendances
              </Text>
            </View>

            <Text className="mt-1 text-[15px] font-black text-white">
              {summary.moduleCount}
            </Text>
          </View>

          <View
            className="rounded-2xl px-3 py-2"
            style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.05)", borderStyle: "solid" }}
          >
            <View className="flex items-center gap-1.5">
              <Clock3 size={10} className="text-cyan-300" />

              <Text className="text-[8px] font-bold uppercase tracking-wide text-white/25">
                Nouveau
              </Text>
            </View>

            <Text className="mt-1 truncate text-[10px] font-black text-white">
              {summary.newestLabel ?? "Pour vous"}
            </Text>
          </View>
        </View>

        {/* ====================================================================
            ITEMS
           ================================================================== */}

        <View className="relative space-y-2 px-3 pb-3">
          <>
            {cleanItems.map((item, index) => (
              <BriefItem
                key={String(item._id ?? item.id ?? index)}
                item={item}
                index={index}
                onNavigate={onNavigate}
                onOpenItem={onOpenItem}
              />
            ))}
          </>
        </View>

        {/* ====================================================================
            FOOTER
           ================================================================== */}

        <View
          className="relative flex items-center gap-2 border-t px-4 py-3"
          style={{
            borderColor: "rgba(255,255,255,.055)",
          }}
        >
          <View
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(99,102,241,.10)" }}
          >
            <Sparkles size={10} className="text-indigo-300" />
          </View>

          <Text className="min-w-0 flex-1 truncate text-[8px] font-medium text-white/25">
            <Text>Sélection personnalisée à partir de votre espace.</Text></Text>

          <Pressable
            type="button"
            onPress={() => onNavigate("community")}
            className="flex shrink-0 items-center gap-1 text-[9px] font-bold text-indigo-200"
          >
            <Text>Tout voir</Text><ArrowRight size={10} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
