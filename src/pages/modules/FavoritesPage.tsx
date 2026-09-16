import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Heart,
  Trash2,
  Building2,
  Briefcase,
  Bus,
  HeartPulse,
  Wallet,
  Users,
  Package,
  Leaf,
  Newspaper,
  Calendar,
  Plane,
  Shield,
  Compass,
  Star,
  LogIn,
  ChevronRight,
  Bookmark,
  Sparkles,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";

interface Props {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

type ModuleMeta = {
  icon: React.ElementType;
  color: string;
  label: string;
};

type BookmarkDisplayItem = {
  bookmarkId: Id<"bookmarks">;
  publicationId: Id<"publications">;
  module: string;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
  badgeColor?: string;
  savedAt: number;
};

const MODULE_META: Record<string, ModuleMeta> = {
  immo: {
    icon: Building2,
    color: "#F97316",
    label: "Immobilier",
  },
  job: {
    icon: Briefcase,
    color: "#8B5CF6",
    label: "Jobs / Pro",
  },
  service: {
    icon: Briefcase,
    color: "#8B5CF6",
    label: "Services",
  },
  transport: {
    icon: Bus,
    color: "#3B82F6",
    label: "Transport",
  },
  sante: {
    icon: HeartPulse,
    color: "#EF4444",
    label: "Santé",
  },
  annonce: {
    icon: Wallet,
    color: "#10B981",
    label: "Annonces",
  },
  community: {
    icon: Users,
    color: "#8B5CF6",
    label: "Community",
  },
  evenement: {
    icon: Calendar,
    color: "#EC4899",
    label: "Événements",
  },
  agri: {
    icon: Leaf,
    color: "#22C55E",
    label: "Agri",
  },
  restauration: {
    icon: Package,
    color: "#F97316",
    label: "Restauration",
  },
  hebergement: {
    icon: Plane,
    color: "#A78BFA",
    label: "Hébergement",
  },
  energie: {
    icon: Shield,
    color: "#06B6D4",
    label: "Énergie",
  },
  ong: {
    icon: Users,
    color: "#EC4899",
    label: "ONG",
  },

  // Compatibilité avec les anciennes clés de regroupement.
  jobs: {
    icon: Briefcase,
    color: "#8B5CF6",
    label: "Jobs / Pro",
  },
  paiement: {
    icon: Wallet,
    color: "#10B981",
    label: "Paiement",
  },
  livraison: {
    icon: Package,
    color: "#F97316",
    label: "Livraison",
  },
  media: {
    icon: Newspaper,
    color: "#06B6D4",
    label: "Média",
  },
  evenements: {
    icon: Calendar,
    color: "#EC4899",
    label: "Événements",
  },
  voyages: {
    icon: Plane,
    color: "#A78BFA",
    label: "Voyages",
  },
  sos: {
    icon: Shield,
    color: "#EF4444",
    label: "SOS",
  },
  explorer: {
    icon: Compass,
    color: "#6366F1",
    label: "Explorer",
  },
};

const FALLBACK_META: ModuleMeta = {
  icon: Star,
  color: "#9CA3AF",
  label: "Autres",
};

function getModuleMeta(module: string): ModuleMeta {
  return (
    MODULE_META[module] ?? {
      ...FALLBACK_META,
      label: module || FALLBACK_META.label,
    }
  );
}

function formatSavedDate(timestamp: number): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: fr,
  });
}

function LoadingState() {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-5">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="mt-3 h-7 w-52 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-72 rounded-md" />
      </View>

      <View className="gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <View
            key={index}
            className="rounded-3xl p-3"
            style={{
              backgroundColor: "rgba(255,255,255,0.035)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <View className="flex-row items-center">
              <Skeleton className="h-16 w-16 rounded-2xl" />

              <View className="ml-3 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="mt-2 h-3 w-full rounded-md" />
                <Skeleton className="mt-2 h-3 w-1/2 rounded-md" />
              </View>

              <Skeleton className="ml-3 h-10 w-10 rounded-xl" />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function UnauthenticatedState() {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
        paddingBottom: 80,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        className="h-24 w-24 items-center justify-center rounded-[30px]"
        style={{
          backgroundColor: "rgba(239,68,68,0.08)",
          borderWidth: 1,
          borderColor: "rgba(239,68,68,0.16)",
        }}
      >
        <Heart size={38} color="#F87171" />
      </View>

      <Text className="mt-7 text-center text-2xl font-extrabold text-white">
        Tes favoris t'attendent
      </Text>

      <Text className="mt-3 max-w-[320px] text-center text-sm leading-6 text-white/45">
        Connecte-toi pour retrouver les publications que tu as sauvegardées.
      </Text>

      <View className="mt-7">
        <SignInButton />
      </View>
    </ScrollView>
  );
}

function EmptyState() {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
        paddingBottom: 80,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        className="h-24 w-24 items-center justify-center rounded-[30px]"
        style={{
          backgroundColor: "rgba(99,102,241,0.09)",
          borderWidth: 1,
          borderColor: "rgba(129,140,248,0.17)",
        }}
      >
        <Bookmark size={38} color="#818CF8" />
      </View>

      <Text className="mt-7 text-center text-2xl font-extrabold text-white">
        Aucun favori pour l'instant
      </Text>

      <Text className="mt-3 max-w-[330px] text-center text-sm leading-6 text-white/45">
        Quand tu sauvegarderas une publication, elle apparaîtra ici pour être
        retrouvée rapidement.
      </Text>

      <View
        className="mt-7 flex-row items-center rounded-2xl px-4 py-3"
        style={{
          backgroundColor: "rgba(255,255,255,0.035)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <Sparkles size={15} color="#A5B4FC" />

        <Text className="ml-2 text-xs font-medium text-white/45">
          Sauvegarde ce qui compte pour toi
        </Text>
      </View>
    </ScrollView>
  );
}

function ModuleHeader({ meta, count }: { meta: ModuleMeta; count: number }) {
  const Icon = meta.icon;

  return (
    <View className="mb-3 flex-row items-center">
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${meta.color}16`,
          borderWidth: 1,
          borderColor: `${meta.color}28`,
        }}
      >
        <Icon size={16} color={meta.color} />
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-sm font-extrabold text-white">{meta.label}</Text>

        <Text className="mt-0.5 text-[10px] text-white/30">
          {count} élément{count === 1 ? "" : "s"} sauvegardé
          {count === 1 ? "" : "s"}
        </Text>
      </View>

      <View
        className="min-w-8 items-center rounded-full px-2.5 py-1"
        style={{
          backgroundColor: `${meta.color}15`,
          borderWidth: 1,
          borderColor: `${meta.color}25`,
        }}
      >
        <Text
          className="text-[10px] font-extrabold"
          style={{ color: meta.color }}
        >
          {count}
        </Text>
      </View>
    </View>
  );
}

function FavCard({
  fav,
  moduleColor,
  onOpen,
  onRemove,
}: {
  fav: BookmarkDisplayItem;
  moduleColor: string;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const [removing, setRemoving] = useState(false);

  const ago = useMemo(() => formatSavedDate(fav.savedAt), [fav.savedAt]);

  const handleRemove = () => {
    if (removing) {
      return;
    }

    Alert.alert(
      "Retirer des favoris ?",
      "Cette publication sera retirée de tes favoris.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => {
            setRemoving(true);
            onRemove();
          },
        },
      ],
    );
  };

  return (
    <View
      className="mb-2.5 overflow-hidden rounded-3xl"
      style={{
        backgroundColor: "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.075)",
        opacity: removing ? 0.5 : 1,
      }}
    >
      <Pressable
        onPress={onOpen}
        disabled={removing}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir ${fav.title}`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.84 : 1,
        })}
      >
        <View className="flex-row items-center p-3">
          {/* Image */}
          {fav.image ? (
            <Image
              source={{ uri: fav.image }}
              resizeMode="cover"
              accessibilityLabel={fav.title}
              className="h-16 w-16 rounded-2xl"
            />
          ) : (
            <View
              className="h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${moduleColor}12`,
                borderWidth: 1,
                borderColor: `${moduleColor}20`,
              }}
            >
              <Heart size={22} color={moduleColor} />
            </View>
          )}

          {/* Content */}
          <View className="ml-3 flex-1">
            <Text
              className="text-sm font-extrabold leading-5 text-white"
              numberOfLines={2}
            >
              {fav.title}
            </Text>

            {fav.subtitle ? (
              <Text
                className="mt-1 text-xs leading-4 text-white/40"
                numberOfLines={2}
              >
                {fav.subtitle}
              </Text>
            ) : null}

            <View className="mt-2 flex-row items-center">
              {fav.badge ? (
                <View
                  className="mr-2 max-w-[55%] rounded-lg px-2 py-1"
                  style={{
                    backgroundColor: `${fav.badgeColor ?? moduleColor}13`,
                    borderWidth: 1,
                    borderColor: `${fav.badgeColor ?? moduleColor}25`,
                  }}
                >
                  <Text
                    className="text-[9px] font-extrabold"
                    style={{
                      color: fav.badgeColor ?? moduleColor,
                    }}
                    numberOfLines={1}
                  >
                    {fav.badge}
                  </Text>
                </View>
              ) : null}

              <Text
                className="flex-1 text-[10px] text-white/25"
                numberOfLines={1}
              >
                Sauvegardé {ago}
              </Text>
            </View>
          </View>

          <View className="ml-2 items-center">
            <ChevronRight size={17} color="rgba(255,255,255,0.25)" />
          </View>
        </View>
      </Pressable>

      {/* Remove action */}
      <View
        className="flex-row items-center justify-between px-3 pb-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.045)",
        }}
      >
        <View className="flex-row items-center pt-2">
          <Bookmark size={11} color={moduleColor} />
          <Text className="ml-1.5 text-[9px] font-semibold text-white/25">
            Sauvegardé
          </Text>
        </View>

        <Pressable
          onPress={handleRemove}
          disabled={removing}
          className="flex-row items-center rounded-xl px-3 py-2"
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? "rgba(239,68,68,0.18)"
              : "rgba(239,68,68,0.08)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.13)",
            opacity: removing ? 0.45 : 1,
          })}
          accessibilityRole="button"
          accessibilityLabel={`Retirer ${fav.title} des favoris`}
        >
          <Trash2 size={13} color="#F87171" />

          <Text className="ml-1.5 text-[10px] font-bold text-red-300">
            Retirer
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FavoritesContent({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const rawBookmarks = useQuery(api.bookmarks.listMine, {});
  const toggleBookmark = useMutation(api.bookmarks.toggle);

  const [removingId, setRemovingId] = useState<Id<"publications"> | null>(null);

  const favorites = useMemo<BookmarkDisplayItem[]>(() => {
    if (!rawBookmarks) {
      return [];
    }

    return rawBookmarks
      .filter((bookmark) => bookmark.publication !== null)
      .map((bookmark) => {
        const publication = bookmark.publication!;

        return {
          bookmarkId: bookmark._id,
          publicationId: bookmark.publicationId,
          module: publication.type,
          title: publication.title,
          subtitle:
            publication.description.length > 100
              ? `${publication.description.slice(0, 100)}…`
              : publication.description,
          image: publication.images[0] ?? undefined,
          badge: publication.price ?? publication.location ?? undefined,
          badgeColor: undefined,
          savedAt: bookmark._creationTime,
        };
      });
  }, [rawBookmarks]);

  const grouped = useMemo(() => {
    const result: Record<string, BookmarkDisplayItem[]> = {};

    for (const favorite of favorites) {
      if (!result[favorite.module]) {
        result[favorite.module] = [];
      }

      result[favorite.module].push(favorite);
    }

    return result;
  }, [favorites]);

  const modules = useMemo(() => {
    return Object.keys(grouped).sort((a, b) => {
      const labelA = getModuleMeta(a).label;
      const labelB = getModuleMeta(b).label;

      return labelA.localeCompare(labelB, "fr");
    });
  }, [grouped]);

  const handleRemove = async (publicationId: Id<"publications">) => {
    setRemovingId(publicationId);

    try {
      await toggleBookmark({
        publicationId,
      });
    } catch (error) {
      console.error("Remove favorite error:", error);

      Alert.alert(
        "Impossible de retirer",
        "Une erreur est survenue. Le favori n'a pas pu être modifié.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (rawBookmarks === undefined) {
    return <LoadingState />;
  }

  if (favorites.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 42,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary */}
      <View
        className="mb-7 overflow-hidden rounded-[28px] p-5"
        style={{
          backgroundColor: "rgba(99,102,241,0.075)",
          borderWidth: 1,
          borderColor: "rgba(129,140,248,0.15)",
        }}
      >
        <View className="flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "rgba(99,102,241,0.13)",
            }}
          >
            <Heart size={20} color="#A5B4FC" />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-sm font-extrabold text-white">
              Ton espace sauvegardé
            </Text>

            <Text className="mt-1 text-xs leading-5 text-white/40">
              Retrouve rapidement les contenus importants pour toi.
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row">
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-white/30">
              Favoris
            </Text>

            <Text className="mt-1 text-xl font-extrabold text-white">
              {favorites.length}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-white/30">
              Univers
            </Text>

            <Text className="mt-1 text-xl font-extrabold text-white">
              {modules.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Modules */}
      {modules.map((module) => {
        const meta = getModuleMeta(module);
        const items = grouped[module];

        return (
          <View key={module} className="mb-7">
            <ModuleHeader meta={meta} count={items.length} />

            {items.map((favorite) => (
              <FavCard
                key={favorite.bookmarkId}
                fav={favorite}
                moduleColor={meta.color}
                onOpen={() => onNavigate(favorite.module)}
                onRemove={() => void handleRemove(favorite.publicationId)}
              />
            ))}
          </View>
        );
      })}

      {/* Integrity notice */}
      <View
        className="mt-1 rounded-3xl p-4"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.065)",
        }}
      >
        <View className="flex-row items-start">
          <Shield size={17} color="#94A3B8" />

          <Text className="ml-3 flex-1 text-[11px] leading-5 text-white/35">
            Cette liste est alimentée par tes favoris enregistrés dans ton
            compte. Les éléments supprimés ou devenus indisponibles ne sont pas
            remplacés par des données fictives.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function FavoritesPage({ onBack, onNavigate }: Props) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#050812",
      }}
    >
      {/* Ambient premium background */}
      <View
        pointerEvents="none"
        className="absolute right-[-100px] top-[-110px] h-72 w-72 rounded-full"
        style={{
          backgroundColor: "rgba(99,102,241,0.055)",
        }}
      />

      <View
        pointerEvents="none"
        className="absolute bottom-[-140px] left-[-120px] h-80 w-80 rounded-full"
        style={{
          backgroundColor: "rgba(14,165,233,0.035)",
        }}
      />

      {/* Header */}
      <View
        className="flex-row items-center px-5 pb-4 pt-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.065)",
        }}
      >
        <Pressable
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? "rgba(255,255,255,0.10)"
              : "rgba(255,255,255,0.055)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          })}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={19} color="rgba(255,255,255,0.78)" />
        </Pressable>

        <View className="ml-3 flex-1">
          <Text className="text-lg font-extrabold text-white">Favoris</Text>

          <Text className="mt-0.5 text-[11px] text-white/40">
            Tes publications sauvegardées
          </Text>
        </View>

        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.13)",
          }}
        >
          <Heart size={17} color="#F87171" />
        </View>
      </View>

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
