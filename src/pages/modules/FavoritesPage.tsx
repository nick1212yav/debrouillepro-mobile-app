import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image } from "react-native";
import {
  ArrowLeft, Heart, Trash2, Building2, Briefcase,
  Bus, HeartPulse, Wallet, Users, Package, Leaf, Newspaper,
  Calendar, Plane, Shield, Compass, Star, LogIn,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
// ── Module metadata for display ──────────────────────────────────────────────
const MODULE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  immo:          { icon: Building2,  color: "#F97316", label: "Immobilier" },
  job:           { icon: Briefcase,  color: "#8B5CF6", label: "Jobs / Pro" },
  service:       { icon: Briefcase,  color: "#8B5CF6", label: "Services" },
  transport:     { icon: Bus,        color: "#3B82F6", label: "Transport" },
  sante:         { icon: HeartPulse, color: "#EF4444", label: "Santé" },
  annonce:       { icon: Wallet,     color: "#10B981", label: "Annonces" },
  community:     { icon: Users,      color: "#8B5CF6", label: "Community" },
  evenement:     { icon: Calendar,   color: "#EC4899", label: "Événements" },
  agri:          { icon: Leaf,       color: "#22C55E", label: "Agri" },
  restauration:  { icon: Package,    color: "#F97316", label: "Restauration" },
  hebergement:   { icon: Plane,      color: "#A78BFA", label: "Hébergement" },
  energie:       { icon: Shield,     color: "#06B6D4", label: "Énergie" },
  ong:           { icon: Users,      color: "#EC4899", label: "ONG" },
  // Legacy keys from previous localStorage-based grouping
  jobs:          { icon: Briefcase,  color: "#8B5CF6", label: "Jobs / Pro" },
  paiement:      { icon: Wallet,     color: "#10B981", label: "Paiement" },
  livraison:     { icon: Package,    color: "#F97316", label: "Livraison" },
  media:         { icon: Newspaper,  color: "#06B6D4", label: "Média" },
  evenements:    { icon: Calendar,   color: "#EC4899", label: "Événements" },
  voyages:       { icon: Plane,      color: "#A78BFA", label: "Voyages" },
  sos:           { icon: Shield,     color: "#EF4444", label: "SOS" },
  explorer:      { icon: Compass,    color: "#6366F1", label: "Explorer" },
};

// ── Types for mapped bookmark items ─────────────────────────────────────────
type BookmarkDisplayItem = {
  bookmarkId: Id<"bookmarks">;
  publicationId: Id<"publications">;
  module: string;
  title: string;
  subtitle: string | undefined;
  image: string | undefined;
  badge: string | undefined;
  badgeColor: string | undefined;
  savedAt: number;
};

interface Props {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function FavoritesPage({ onBack, onNavigate }: Props) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <View
      className="relative h-full w-full overflow-hidden flex flex-col"
      style={{  }}
    >
      {/* Ambient glows */}
      <View className="absolute top-0 right-0 w-64 h-64 rounded-full"
        style={{  }} />
      <View className="absolute bottom-20 left-0 w-48 h-48 rounded-full"
        style={{  }} />

      {/* Header */}
      <View
        className="flex-shrink-0 px-5 pt-14 pb-4 flex items-center justify-between"
        style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", }}
      >
        <View className="flex items-center gap-3">
          <Pressable
            onPress={onBack}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <ArrowLeft size={17} className="text-white/80" />
          </Pressable>
          <View>
            <Text className="text-lg font-black text-white tracking-tight">Favoris</Text>
            <Text className="text-[11px] text-white/40">Vos publications sauvegardées</Text>
          </View>
        </View>
      </View>

      {/* Auth-aware content */}
      {isLoading ? (
        <LoadingState />
      ) : !isAuthenticated ? (
        <UnauthenticatedState />
      ) : (
        <FavoritesContent onNavigate={onNavigate} />
      )}
    </View>
  );
}

// ── Authenticated Content ────────────────────────────────────────────────────
function FavoritesContent({ onNavigate }: { onNavigate: (page: string) => void }) {
  const rawBookmarks = useQuery(api.bookmarks.listMine, {});
  const toggleBookmark = useMutation(api.bookmarks.toggle);

  // Map raw bookmarks to display items
  const favorites: BookmarkDisplayItem[] = (rawBookmarks ?? [])
    .filter(b => b.publication !== null)
    .map(b => {
      const pub = b.publication!;
      return {
        bookmarkId: b._id,
        publicationId: b.publicationId,
        module: pub.type,
        title: pub.title,
        subtitle: pub.description.length > 80 ? pub.description.slice(0, 80) + "…" : pub.description,
        image: pub.images[0] ?? undefined,
        badge: pub.price ?? pub.location ?? undefined,
        badgeColor: undefined,
        savedAt: b._creationTime,
      };
    });

  const handleRemove = async (publicationId: Id<"publications">) => {
    try {
      await toggleBookmark({ publicationId });
      UIService.openToast("Favori retiré", "success");
    } catch {
      UIService.openToast("Erreur lors de la suppression", "error");
    }
  };

  // Still loading from Convex
  if (rawBookmarks === undefined) {
    return <LoadingState />;
  }

  // Group by module
  const grouped: Record<string, BookmarkDisplayItem[]> = {};
  for (const fav of favorites) {
    if (!grouped[fav.module]) grouped[fav.module] = [];
    grouped[fav.module].push(fav);
  }
  const modules = Object.keys(grouped);

  return (
    <View className="flex-1 overflow-y-auto pb-8" style={{  }}>
      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        <View className="px-5 pt-4 flex flex-col gap-6">
          {/* Count header */}
          <View className="flex items-center justify-between">
            <Text className="text-[11px] text-white/40">
              {favorites.length} élément{favorites.length !== 1 ? "s" : ""} sauvegardé{favorites.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {modules.map((mod, mi) => {
            const meta = MODULE_META[mod] ?? { icon: Star, color: "#9CA3AF", label: mod };
            const Icon = meta.icon;
            return (
              <View
                key={mod}
              >
                {/* Section header */}
                <View className="flex items-center gap-2 mb-3">
                  <View className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${meta.color}20` }}>
                    <Icon size={14} style={{ color: meta.color }} />
                  </View>
                  <Text className="text-xs font-bold text-white/60 uppercase tracking-widest">{meta.label}</Text>
                  <Text
                    className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: `${meta.color}25`, color: meta.color }}
                  >
                    {grouped[mod].length}
                  </Text>
                </View>

                {/* Cards */}
                <View className="flex flex-col gap-2">
                  <>
                    {grouped[mod].map((fav) => (
                      <FavCard
                        key={fav.bookmarkId}
                        fav={fav}
                        moduleColor={meta.color}
                        onOpen={() => onNavigate(fav.module)}
                        onRemove={() => handleRemove(fav.publicationId)}
                      />
                    ))}
                  </>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Favorite Card ────────────────────────────────────────────────────────────
function FavCard({
  fav, moduleColor, onOpen, onRemove
}: {
  fav: BookmarkDisplayItem;
  moduleColor: string;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const ago = formatDistanceToNow(new Date(fav.savedAt), { addSuffix: true, locale: fr });

  return (
    <Pressable
      onPress={onOpen}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
    >
      {/* Thumbnail or placeholder */}
      {fav.image ? (
        <Image className="w-14 h-14 rounded-xl object-cover flex-shrink-0"  source={{ uri: fav.image }} accessibilityLabel={fav.title}/>
      ) : (
        <View className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${moduleColor}15` }}>
          <Heart size={20} style={{ color: moduleColor }} />
        </View>
      )}

      {/* Text */}
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-bold text-white truncate">{fav.title}</Text>
        {fav.subtitle && (
          <Text className="text-xs text-white/45 truncate mt-0.5">{fav.subtitle}</Text>
        )}
        <View className="flex items-center gap-2 mt-1">
          {fav.badge && (
            <Text
              className="px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{ backgroundColor: `${fav.badgeColor ?? moduleColor}20`, color: fav.badgeColor ?? moduleColor }}
            >
              {fav.badge}
            </Text>
          )}
          <Text className="text-[10px] text-white/25">{ago}</Text>
        </View>
      </View>

      {/* Remove */}
      <Pressable
        onPress={(e) => { onRemove(); }}
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.15)", borderStyle: "solid" }}
      >
        <Trash2 size={13} className="text-red-400" />
      </Pressable>
    </Pressable>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View
      className="flex flex-col items-center justify-center pt-24 px-8 text-center"
    >
      <View
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
        style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}
      >
        <Heart size={32} className="text-red-400" />
      </View>
      <Text className="text-xl font-black text-white mb-2">Aucun favori</Text>
      <Text className="text-sm text-white/40 leading-relaxed">
        Appuyez sur le coeur sur n{"'"}importe quelle publication pour la sauvegarder ici.
      </Text>
    </View>
  );
}

// ── Unauthenticated State ────────────────────────────────────────────────────
function UnauthenticatedState() {
  return (
    <View
      className="flex flex-col items-center justify-center pt-24 px-8 text-center gap-4"
    >
      <View
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}
      >
        <LogIn size={28} className="text-red-400" />
      </View>
      <Text className="text-white/50 text-sm font-medium">Connectez-vous pour voir vos favoris</Text>
      <SignInButton />
    </View>
  );
}

// ── Loading State ────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <View className="flex flex-col gap-3 px-5 pt-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </View>
  );
}
