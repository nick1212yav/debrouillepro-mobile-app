import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text, Image, ViewStyle, TextStyle, ImageStyle } from "react-native";
import {
  ArrowLeft,
  TrendingUp,
  Hash,
  Users,
  Sparkles,
  Heart,
  MessageCircle,
  Eye,
  MapPin,
  Flame,
  Star,
  ChevronRight,
  UserPlus,
  Package,
  Briefcase,
  Home,
  Car,
  Leaf,
  Plane,
  CalendarDays,
  ShoppingBag,
  Zap,
  HandHeart,
  Newspaper,
} from "lucide-react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Skeleton } from "@/components/ui/skeleton";
// ── Type icons map ────────────────────────────────────────────────────────────
const TYPE_META: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ size?: number; style?: ViewStyle | TextStyle | ImageStyle }>;
  }
> = {
  immo: { label: "Immobilier", color: "#10B981", icon: Home },
  job: { label: "Emploi", color: "#8B5CF6", icon: Briefcase },
  service: { label: "Services", color: "#F97316", icon: Package },
  evenement: { label: "Événements", color: "#EC4899", icon: CalendarDays },
  community: { label: "Community", color: "#3B82F6", icon: Users },
  agri: { label: "Agriculture", color: "#22C55E", icon: Leaf },
  sante: { label: "Santé", color: "#EF4444", icon: Heart },
  transport: { label: "Transport", color: "#3B82F6", icon: Car },
  annonce: { label: "Annonces", color: "#F59E0B", icon: Newspaper },
  restauration: { label: "Restau.", color: "#F97316", icon: ShoppingBag },
  hebergement: { label: "Hébergement", color: "#0EA5E9", icon: Plane },
  energie: { label: "Énergie", color: "#FBBF24", icon: Zap },
  ong: { label: "ONG", color: "#10B981", icon: HandHeart },
};

// ── Tag colors cycling ────────────────────────────────────────────────────────
const TAG_COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F97316",
  "#EF4444",
  "#F59E0B",
  "#06B6D4",
  "#A78BFA",
  "#22C55E",
];

interface Props {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onViewProfile?: (userId: Id<"users">) => void;
}

type Tab = "tendances" | "tags" | "utilisateurs" | "categories";

export default function DecouvertePage({
  onBack,
  onNavigate,
  onViewProfile,
}: Props) {
  const [tab, setTab] = useState<Tab>("tendances");
  const { isAuthenticated } = useConvexAuth();

  const trendingPubs = useQuery(api.discover.trendingPublications, {
    limit: 12,
  });
  const trendingTags = useQuery(api.discover.trendingTags, {});
  const suggestedUsers = useQuery(
    api.discover.suggestedUsers,
    isAuthenticated ? {} : "skip",
  );
  const categories = useQuery(api.discover.categorySpotlight, {});

  const followMutation = useMutation(api.follows.toggleFollow);

  const handleFollow = async (userId: Id<"users">, name: string) => {
    if (!isAuthenticated) {
      UIService.openToast("Connectez-vous pour suivre des utilisateurs", "info");
      return;
    }
    try {
      await followMutation({ targetUserId: userId });
      UIService.openToast(`Vous suivez maintenant ${name} !`, "success");
    } catch {
      UIService.openToast("Impossible de suivre cet utilisateur", "error");
    }
  };

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = [
    { key: "tendances", label: "Tendances", icon: TrendingUp },
    { key: "tags", label: "Tags", icon: Hash },
    { key: "utilisateurs", label: "Personnes", icon: Users },
    { key: "categories", label: "Catégories", icon: Sparkles },
  ];

  return (
    <View
      className="relative h-full w-full overflow-hidden flex flex-col"
      style={{  }}
    >
      {/* Ambient glows */}
      <View
        className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full"
        style={{  }}
      />
      <View
        className="absolute bottom-20 right-0 w-48 h-48 rounded-full"
        style={{  }}
      />

      {/* Header */}
      <View
        className="flex-shrink-0 px-5 pt-14 pb-4"
        style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", }}
      >
        <View className="flex items-center gap-3 mb-5">
          <Pressable
            onPress={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <ArrowLeft size={17} className="text-white/80" />
          </Pressable>
          <View className="flex-1">
            <View className="flex items-center gap-2">
              <Text className="text-xl font-black text-white tracking-tight">
                Découverte
              </Text>
              <Text
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ color: "white" }}
              >
                LIVE
              </Text>
            </View>
            <Text className="text-[11px] text-white/40 mt-0.5">
              Tendances · Personnes · Contenu
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View
          className="flex gap-2 overflow-x-auto"
          style={{  }}
        >
          {tabs.map(({ key, label, icon: Icon }) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold"
              style={{ backgroundColor: tab === key
                                  ? "rgba(236,72,153,0.18)"
                                  : "rgba(255,255,255,0.05)", borderColor: "rgba(236,72,153,0.35)", borderStyle: "solid" }}
            >
              <Icon size={12} />
              {label}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      <View
        className="flex-1 overflow-y-auto px-4 pt-4 pb-24"
        style={{  }}
      >
        <>
          {tab === "tendances" && (
            <View
              key="tendances"
            >
              <TrendingSection pubs={trendingPubs} onNavigate={onNavigate} />
            </View>
          )}
          {tab === "tags" && (
            <View
              key="tags"
            >
              <TagsSection tags={trendingTags} />
            </View>
          )}
          {tab === "utilisateurs" && (
            <View
              key="utilisateurs"
            >
              <UsersSection
                users={suggestedUsers}
                onFollow={handleFollow}
                onViewProfile={onViewProfile}
                isAuthenticated={isAuthenticated}
              />
            </View>
          )}
          {tab === "categories" && (
            <View
              key="categories"
            >
              <CategoriesSection
                categories={categories}
                onNavigate={onNavigate}
              />
            </View>
          )}
        </>
      </View>
    </View>
  );
}

// ── Trending Publications Section ─────────────────────────────────────────────
type TrendingPub = {
  _id: Id<"publications">;
  title: string;
  description: string;
  type: string;
  tags: string[];
  images: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  score: number;
  authorName: string;
  authorAvatar?: string;
  location?: string;
};

function TrendingSection({
  pubs,
  onNavigate,
}: {
  pubs: TrendingPub[] | undefined;
  onNavigate: (p: string) => void;
}) {
  if (!pubs) return <TrendingSkeleton />;

  if (pubs.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-20 gap-3">
        <Flame size={32} className="text-white/15" />
        <Text className="text-white/40 text-sm">Aucune tendance disponible</Text>
        <Text className="text-white/25 text-xs">
          Publiez du contenu pour apparaître ici
        </Text>
      </View>
    );
  }

  // Featured top card + grid
  const [top, ...rest] = pubs;

  return (
    <View className="space-y-3">
      {/* Section header */}
      <View className="flex items-center gap-2 mb-1">
        <Flame size={14} style={{ color: "#EC4899" }} />
        <Text className="text-xs font-bold text-white/60 uppercase tracking-widest">
          En ce moment
        </Text>
      </View>

      {/* Top card */}
      <Pressable
        className="relative rounded-3xl overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
        onPress={() => {
          const t = top.type as keyof typeof TYPE_META;
          if (TYPE_META[t]) onNavigate(t);
        }}
      >
        {top.images[0] && (
          <Image
           
           
            className="w-full h-40 object-cover"
           source={{ uri: top.images[0] }} accessibilityLabel={top.title}/>
        )}
        {!top.images[0] && (
          <View
            className="w-full h-32 flex items-center justify-center"
            style={{ backgroundColor: `${TYPE_META[top.type as keyof typeof TYPE_META]?.color ?? "#8B5CF6"}18` }}
          >
            {(() => {
              const meta = TYPE_META[top.type as keyof typeof TYPE_META];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <Icon size={36} style={{ color: meta.color, opacity: 0.5 }} />
              );
            })()}
          </View>
        )}
        {/* Overlay */}
        <View
          className="absolute top-0 left-0 right-0 h-24"
          style={{  }}
        />
        <View
          className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <Flame size={10} style={{ color: "#F472B6" }} />
          <Text className="text-[10px] font-bold text-white">#1 Tendance</Text>
        </View>

        <View className="p-4">
          <View className="flex items-start justify-between gap-2 mb-2">
            <View className="flex-1 min-w-0">
              <Text className="text-white font-bold text-sm leading-tight">
                {top.title}
              </Text>
              <Text className="text-white/50 text-xs mt-1">
                {top.description}
              </Text>
            </View>
            {(() => {
              const meta = TYPE_META[top.type as keyof typeof TYPE_META];
              if (!meta) return null;
              return (
                <Text
                  className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: `${meta.color}25`, color: meta.color }}
                >
                  {meta.label}
                </Text>
              );
            })()}
          </View>

          <View className="flex items-center gap-3">
            <View
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{  }}
            >
              {top.authorName[0]?.toUpperCase() ?? "?"}
            </View>
            <Text className="text-white/50 text-[11px]">{top.authorName}</Text>
            {top.location && (
              <View className="flex items-center gap-0.5 ml-auto">
                <MapPin size={9} className="text-white/30" />
                <Text className="text-white/30 text-[10px]">
                  {top.location}
                </Text>
              </View>
            )}
          </View>

          <View
            className="flex items-center gap-4 mt-3 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", }}
          >
            <View className="flex items-center gap-1">
              <Heart size={11} style={{ color: "#EC4899" }} />
              <Text className="text-white/60 text-xs">{top.likeCount}</Text>
            </View>
            <View className="flex items-center gap-1">
              <MessageCircle size={11} className="text-white/40" />
              <Text className="text-white/60 text-xs">{top.commentCount}</Text>
            </View>
            <View className="flex items-center gap-1">
              <Eye size={11} className="text-white/40" />
              <Text className="text-white/60 text-xs">{top.viewCount}</Text>
            </View>
            <View className="ml-auto flex items-center gap-1">
              <Star size={10} style={{ color: "#FBBF24" }} />
              <Text
                className="text-[10px] font-bold"
                style={{ color: "#FBBF24" }}
              >
                Score {top.score}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Rest grid */}
      <View className="gap-2.5 mt-1">
        {rest.map((pub, i) => {
          const meta = TYPE_META[pub.type as keyof typeof TYPE_META];
          return (
            <Pressable
              key={pub._id}
              className="relative rounded-2xl p-3 overflow-hidden"
              style={{ backgroundColor: `${meta?.color ?? "#8B5CF6"}0D`, borderColor: "#8B5CF6", borderStyle: "solid" }}
              onPress={() => {
                if (meta) onNavigate(pub.type);
              }}
            >
              <View className="flex items-center gap-1.5 mb-2">
                <Text
                  className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${meta?.color ?? "#8B5CF6"}25`, color: meta?.color ?? "#8B5CF6" }}
                >
                  #{i + 2}
                </Text>
                {meta && (
                  <Text className="text-[9px] text-white/40 truncate">
                    {meta.label}
                  </Text>
                )}
              </View>
              <Text className="text-white text-xs font-semibold leading-tight mb-2">
                {pub.title}
              </Text>
              <View className="flex items-center gap-2">
                <View className="flex items-center gap-0.5">
                  <Heart size={9} style={{ color: "#EC4899" }} />
                  <Text className="text-white/50 text-[10px]">
                    {pub.likeCount}
                  </Text>
                </View>
                <View className="flex items-center gap-0.5">
                  <Eye size={9} className="text-white/30" />
                  <Text className="text-white/50 text-[10px]">
                    {pub.viewCount}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Tags Section ─────────────────────────────────────────────────────────────
type TrendingTag = { tag: string; count: number; likeCount: number };

function TagsSection({ tags }: { tags: TrendingTag[] | undefined }) {
  if (!tags) return <TagsSkeleton />;

  if (tags.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-20 gap-3">
        <Hash size={32} className="text-white/15" />
        <Text className="text-white/40 text-sm">Aucun tag tendance</Text>
        <Text className="text-white/25 text-xs">
          Utilisez des #tags dans vos publications
        </Text>
      </View>
    );
  }

  const maxCount = tags[0]?.count ?? 1;

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2 mb-1">
        <Hash size={14} style={{ color: "#A78BFA" }} />
        <Text className="text-xs font-bold text-white/60 uppercase tracking-widest">
          Tags populaires
        </Text>
      </View>

      {/* Cloud */}
      <View className="flex flex-wrap gap-2 mb-4">
        {tags.slice(0, 15).map((t, i) => {
          const color = TAG_COLORS[i % TAG_COLORS.length];
          const size = 10 + Math.floor((t.count / maxCount) * 8);
          return (
            <Pressable
              key={t.tag}
              className="px-3 py-1.5 rounded-2xl"
              style={{ backgroundColor: `${color}15`, borderStyle: "solid" }}
            >
              <Text>#</Text>{t.tag}
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <View className="space-y-2">
        {tags.map((t, i) => {
          const color = TAG_COLORS[i % TAG_COLORS.length];
          const pct = Math.round((t.count / maxCount) * 100);
          return (
            <View
              key={t.tag}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderStyle: "solid" }}
            >
              <View
                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}18` }}
              >
                <Text className="text-[10px] font-black" style={{ color }}>
                  #{i + 1}
                </Text>
              </View>
              <View className="flex-1 min-w-0">
                <View className="flex items-center justify-between mb-1">
                  <Text className="text-white font-semibold text-sm">
                    #{t.tag}
                  </Text>
                  <Text className="text-white/40 text-[10px]">
                    {t.count} posts
                  </Text>
                </View>
                {/* Progress bar */}
                <View
                  className="h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
                >
                  <View
                    className="h-full rounded-full"
                    style={{  }}
                  />
                </View>
              </View>
              <View className="flex items-center gap-1 flex-shrink-0">
                <Heart size={9} style={{ color: "#EC4899" }} />
                <Text className="text-white/40 text-[10px]">{t.likeCount}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Suggested Users Section ───────────────────────────────────────────────────
type SuggestedUser = {
  _id: Id<"users">;
  name: string;
  avatar?: string;
  bio?: string;
  city?: string;
  role?: string;
  followerCount: number;
};

function UsersSection({
  users,
  onFollow,
  onViewProfile,
  isAuthenticated,
}: {
  users: SuggestedUser[] | undefined;
  onFollow: (id: Id<"users">, name: string) => void;
  onViewProfile?: (id: Id<"users">) => void;
  isAuthenticated: boolean;
}) {
  if (!users) return <UsersSkeleton />;

  if (!isAuthenticated) {
    return (
      <View className="flex flex-col items-center justify-center py-20 gap-3">
        <Users size={32} className="text-white/15" />
        <Text className="text-white/40 text-sm">Connectez-vous</Text>
        <Text className="text-white/25 text-xs">pour voir les suggestions</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-20 gap-3">
        <Users size={32} className="text-white/15" />
        <Text className="text-white/40 text-sm">Aucune suggestion</Text>
        <Text className="text-white/25 text-xs">
          Vous suivez déjà tout le monde !
        </Text>
      </View>
    );
  }

  const roleLabel: Record<string, string> = {
    particulier: "Particulier",
    professionnel: "Professionnel",
    entreprise: "Entreprise",
  };

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2 mb-1">
        <UserPlus size={14} style={{ color: "#34D399" }} />
        <Text className="text-xs font-bold text-white/60 uppercase tracking-widest">
          Personnes à suivre
        </Text>
      </View>

      {users.map((user, i) => {
        // ✅ Extraction du rôle
        const role = user.role;
        return (
          <View
            key={user._id}
            className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
          >
            {/* Avatar */}
            <Pressable
              onPress={() => onViewProfile?.(user._id)}
              className="flex-shrink-0"
            >
              {user.avatar ? (
                <Image
                 
                 
                  className="w-11 h-11 rounded-2xl object-cover"
                 source={{ uri: user.avatar }} accessibilityLabel={user.name}/>
              ) : (
                <View
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold text-white"
                  style={{  }}
                >
                  {user.name[0]?.toUpperCase() ?? "?"}
                </View>
              )}
            </Pressable>

            <View className="flex-1 min-w-0">
              <View className="flex items-center gap-1.5">
                <Text className="text-white font-semibold text-sm truncate">
                  {user.name}
                </Text>
                {role && (
                  <Text
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                    style={{ backgroundColor: "rgba(139,92,246,0.2)", color: "#A78BFA" }}
                  >
                    {roleLabel[role] ?? role}
                  </Text>
                )}
              </View>
              {user.bio && (
                <Text className="text-white/40 text-[11px] mt-0.5">
                  {user.bio}
                </Text>
              )}
              <View className="flex items-center gap-2 mt-1">
                {user.city && (
                  <View className="flex items-center gap-0.5">
                    <MapPin size={9} className="text-white/30" />
                    <Text className="text-white/30 text-[10px]">
                      {user.city}
                    </Text>
                  </View>
                )}
                <View className="flex items-center gap-0.5">
                  <Users size={9} className="text-white/30" />
                  <Text className="text-white/30 text-[10px]">
                    {user.followerCount} abonnés
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => onFollow(user._id, user.name)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ backgroundColor: "rgba(52,211,153,0.15)", borderWidth: 1, borderColor: "rgba(52,211,153,0.25)", borderStyle: "solid" }}
            >
              <UserPlus size={11} />
              <Text>Suivre</Text></Pressable>
          </View>
        );
      })}
    </View>
  );
}

// ── Categories Section ────────────────────────────────────────────────────────
type CategorySpot = { type: string; count: number; likeCount: number };

function CategoriesSection({
  categories,
  onNavigate,
}: {
  categories: CategorySpot[] | undefined;
  onNavigate: (p: string) => void;
}) {
  if (!categories) return <CategoriesSkeleton />;

  if (categories.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-20 gap-3">
        <Sparkles size={32} className="text-white/15" />
        <Text className="text-white/40 text-sm">Aucune catégorie disponible</Text>
      </View>
    );
  }

  const maxCount = categories[0]?.count ?? 1;

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2 mb-1">
        <Sparkles size={14} style={{ color: "#FBBF24" }} />
        <Text className="text-xs font-bold text-white/60 uppercase tracking-widest">
          Catégories actives
        </Text>
      </View>

      <View className="gap-2.5">
        {categories.map((cat, i) => {
          const meta = TYPE_META[cat.type as keyof typeof TYPE_META];
          const color = meta?.color ?? TAG_COLORS[i % TAG_COLORS.length];
          const Icon = meta?.icon;
          const pct = Math.round((cat.count / maxCount) * 100);
          return (
            <Pressable
              key={cat.type}
              onPress={() => onNavigate(cat.type)}
              className="relative p-4 rounded-3xl text-left overflow-hidden"
              style={{ backgroundColor: `${color}0D`, borderStyle: "solid" }}
            >
              {/* Background fill */}
              <View
                className="absolute inset-0 rounded-3xl"
                style={{ backgroundColor: `${color}08` }}
              />

              <View className="relative">
                {Icon && (
                  <View
                    className="w-9 h-9 rounded-2xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={18} style={{ color }} />
                  </View>
                )}
                <Text className="text-white font-bold text-xs leading-tight">
                  {meta?.label ?? cat.type}
                </Text>
                <Text className="text-white/40 text-[10px] mt-1">
                  {cat.count} publications
                </Text>

                <View className="flex items-center gap-1 mt-2">
                  <Heart size={9} style={{ color: "#EC4899" }} />
                  <Text className="text-white/30 text-[10px]">
                    {cat.likeCount} likes
                  </Text>
                  <ChevronRight size={9} className="ml-auto text-white/20" />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── Skeleton Loaders ──────────────────────────────────────────────────────────
function TrendingSkeleton() {
  return (
    <View className="space-y-3">
      <Skeleton className="h-4 w-32 rounded-xl" />
      <Skeleton className="h-56 w-full rounded-3xl" />
      <View className="gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </View>
    </View>
  );
}

function TagsSkeleton() {
  return (
    <View className="space-y-3">
      <Skeleton className="h-4 w-36 rounded-xl" />
      <View className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 rounded-2xl"
            style={{ width: `${60 + i * 8}px` }}
          />
        ))}
      </View>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-2xl" />
      ))}
    </View>
  );
}

function UsersSkeleton() {
  return (
    <View className="space-y-3">
      <Skeleton className="h-4 w-40 rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </View>
  );
}

function CategoriesSkeleton() {
  return (
    <View className="space-y-3">
      <Skeleton className="h-4 w-36 rounded-xl" />
      <View className="gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl" />
        ))}
      </View>
    </View>
  );
}
