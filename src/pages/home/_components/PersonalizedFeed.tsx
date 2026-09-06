import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text } from "react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  MessageCircle,
  Plus,
  RefreshCw,
} from "lucide-react-native";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { PublicationRenderer } from "@/features/publications/components/PublicationRenderer";
import { usePublicationActions } from "@/features/publications/hooks/usePublicationActions";
import type {
  Publication,
  PublicationType,
} from "@/features/publications/types";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import CommentsSheet from "./CommentsSheet";
import { useHomeFeed } from "@/home/hooks/useHomeFeed";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * PersonalizedFeed — FINAL
 * ============================================================
 *
 * Architecture :
 *
 * PersonalizedFeed
 *       ↓
 * useHomeFeed
 *       ↓
 * Home Feed Engine
 *       ↓
 * Convex
 *
 * Ce composant ne fait PAS :
 * - de ranking
 * - de personnalisation
 * - de requête paginée directe
 * - de données mockées
 *
 * Il est responsable de :
 * - l'affichage
 * - les filtres
 * - les interactions utilisateur
 * - les commentaires
 * - les bookmarks
 * - les likes
 * - la suppression
 * - la pagination UI
 *
 * IMPORTANT :
 * Les données reçues doivent déjà être préparées
 * par le moteur Home / backend.
 * ============================================================
 */

/* ============================================================
 * TYPE → API
 * ============================================================ */

function mapTypeToAPI(type: PublicationType): string {
  const mapping: Record<string, string> = {
    emploi: "job",
    logement: "immo",
    tourisme: "voyages",
    marketplace: "service",
    premium: "service",
    boost: "service",

    reputation: "community",
    recompenses: "community",
    parrainage: "community",
    sos: "community",
    groupes: "community",

    cours: "education",
    quiz: "education",
    certifications: "education",
    apprendre: "education",
    ecole: "education",
    mentorat: "education",

    freelance: "job",

    evenements: "evenement",
    annonces: "annonce",
    voyages: "voyages",
    hebergement: "hebergement",
  };

  return mapping[type] ?? type;
}

/* ============================================================
 * FILTER TYPES
 * ============================================================ */

type FilterType = PublicationType | "all";

interface FilterDefinition {
  value: FilterType;
  label: string;
  color: string;
}

const FILTER_TYPES: FilterDefinition[] = [
  {
    value: "all",
    label: "Tous",
    color: "#8B5CF6",
  },
  {
    value: "community",
    label: "Community",
    color: "#3B82F6",
  },
  {
    value: "evenement",
    label: "Événements",
    color: "#8B5CF6",
  },
  {
    value: "job",
    label: "Emploi",
    color: "#10B981",
  },
  {
    value: "immo",
    label: "Immobilier",
    color: "#6366F1",
  },
  {
    value: "service",
    label: "Services",
    color: "#F59E0B",
  },
  {
    value: "sante",
    label: "Santé",
    color: "#EF4444",
  },
  {
    value: "annonce",
    label: "Annonces",
    color: "#6366F1",
  },
  {
    value: "restauration",
    label: "Restauration",
    color: "#F97316",
  },
  {
    value: "hebergement",
    label: "Hébergement",
    color: "#8B5CF6",
  },
  {
    value: "agri",
    label: "Agriculture",
    color: "#22C55E",
  },
  {
    value: "energie",
    label: "Énergie",
    color: "#F59E0B",
  },
  {
    value: "ong",
    label: "ONG",
    color: "#10B981",
  },
  {
    value: "media",
    label: "Médias",
    color: "#EC4899",
  },
  {
    value: "education",
    label: "Éducation",
    color: "#8B5CF6",
  },
  {
    value: "finance",
    label: "Finance",
    color: "#F59E0B",
  },
  {
    value: "voyages",
    label: "Voyages",
    color: "#06B6D4",
  },
];

/* ============================================================
 * PUBLICATION VALIDATION
 * ============================================================ */

/**
 * Sécurité UI :
 *
 * PublicationRenderer ne reçoit jamais :
 * - null
 * - undefined
 * - objets primitifs
 * - cartes génériques sans identifiant
 * - objets sans type exploitable
 * - objets sans titre exploitable
 *
 * Le moteur Home reste responsable du filtrage métier.
 * Ce garde-fou protège uniquement le rendu.
 */
function isRenderablePublication(value: unknown): value is Publication {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item._id === "string" &&
    item._id.length > 0 &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.type === "string" &&
    item.type.trim().length > 0
  );
}

/* ============================================================
 * BOOKMARK BUTTON
 * ============================================================ */

function BookmarkButton({
  publicationId,
}: {
  publicationId: Id<"publications">;
}) {
  const { isAuthenticated } = useConvexAuth();

  const isBookmarked = useQuery(
    api.bookmarks.isBookmarked,
    isAuthenticated ? { publicationId } : "skip",
  );

  const toggleBookmark = useMutation(api.bookmarks.toggle);

  const [animating, setAnimating] = useState(false);
  const [pending, setPending] = useState(false);

  const saved = isBookmarked === true;

  const handleClick = async () => {
    if (!isAuthenticated || pending) {
      return;
    }

    setAnimating(true);
    setPending(true);

    try {
      const result = await toggleBookmark({
        publicationId,
      });

      UIService.openToast(result
          ? "Publication enregistrée"
          : "Publication retirée des enregistrements", "success");
    } catch {
      UIService.openToast("Impossible de modifier l'enregistrement.", "error");
    } finally {
      setPending(false);

      undefined;
    }
  };

  return (
    <Pressable
      onPress={() => void handleClick()}
      disabled={!isAuthenticated || pending}
      className={cn(
        "relative flex items-center gap-1.5 rounded-xl px-3 py-2",
        "text-xs font-semibold transition-all",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        saved ? "text-yellow-400" : "text-white/50",
      )}
      style={{ backgroundColor: saved ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.06)", borderColor: "rgba(234,179,8,0.3)", borderStyle: "solid" }}
      accessibilityLabel={
        saved
          ? "Retirer la publication des enregistrements"
          : "Enregistrer la publication"
      }
      aria-pressed={saved}
    >
      <View
      >
        {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
      </View>

      <Text className="hidden sm:inline">
        {saved ? "Enregistré" : "Enregistrer"}
      </Text>
    </Pressable>
  );
}

/* ============================================================
 * COMMENTS BUTTON
 * ============================================================ */

function CommentsButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <Pressable
      onPress={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3 py-2",
        "text-xs font-semibold text-white/55",
        "cursor-pointer transition-all",
        "hover:bg-white/10 hover:text-white/80",
      )}
      style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      accessibilityLabel={
        count > 0
          ? `${count} commentaire${count > 1 ? "s" : ""}`
          : "Ajouter un commentaire"
      }
    >
      <MessageCircle size={14} />

      <Text>{count > 0 ? (count > 999 ? "999+" : count) : "Commenter"}</Text>
    </Pressable>
  );
}

/* ============================================================
 * CATEGORY BAR
 * ============================================================ */

function CategoryBar({
  active,
  onChange,
}: {
  active: FilterType;
  onChange: (type: FilterType) => void;
}) {
  return (
    <View
      className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none"
      accessibilityRole="tablist"
      accessibilityLabel="Filtrer le fil d'actualité"
    >
      {FILTER_TYPES.map((item) => {
        const isActive = active === item.value;

        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            aria-selected={isActive}
            onPress={() => onChange(item.value)}
            className={cn(
              "relative flex-shrink-0 whitespace-nowrap",
              "rounded-full px-3.5 py-1.5",
              "text-xs font-semibold",
              "cursor-pointer transition-all",
              isActive ? "text-white" : "text-white/45",
            )}
            style={{ backgroundColor: isActive ? item.color : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid" }}
          >
            {item.label}

            {isActive && (
              <Text
                className="absolute inset-0 -z-10 rounded-full"
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ============================================================
 * FEED SKELETON
 * ============================================================ */

function FeedSkeleton() {
  return (
    <View
      className="mx-4 flex flex-col gap-4"
      accessibilityLabel="Chargement du fil"
     
    >
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className="overflow-hidden rounded-3xl"
          style={{ backgroundColor: "rgba(255,255,255,0.035)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
        >
          <Skeleton className="h-44 w-full rounded-none" />

          <View className="space-y-3 p-4">
            <View className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <View className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32 rounded-full" />
                <Skeleton className="h-2.5 w-20 rounded-full" />
              </View>
            </View>

            <Skeleton className="h-5 w-2/3 rounded-xl" />
            <Skeleton className="h-3 w-full rounded-xl" />
            <Skeleton className="h-3 w-4/5 rounded-xl" />

            <View className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-20 rounded-xl" />
              <Skeleton className="h-8 w-20 rounded-xl" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ============================================================
 * EMPTY FEED
 * ============================================================ */

function EmptyFeed({
  onCreateOpen,
  activeType,
}: {
  onCreateOpen: () => void;
  activeType: FilterType;
}) {
  const isFiltered = activeType !== "all";

  return (
    <View
      className="mx-4"
    >
      <View
        className="relative overflow-hidden rounded-3xl px-6 py-12 text-center"
        style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "dashed" }}
      >
        {/* Ambient glow */}
        <View
          className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{  }}
        />

        <View
          className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}
        >
          <Plus size={28} className="text-violet-400" />
        </View>

        <Text className="mb-1 text-base font-bold text-white">
          {isFiltered
            ? "Aucun contenu dans cette catégorie"
            : "Votre fil est prêt à vivre"}
        </Text>

        <Text className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-white/40">
          {isFiltered
            ? "Essayez une autre catégorie pour découvrir davantage de contenu."
            : "Publiez quelque chose et commencez à construire votre espace dans la communauté."}
        </Text>

        <Pressable
          onPress={onCreateOpen}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl",
            "px-5 py-2.5",
            "text-sm font-bold text-white",
            "cursor-pointer",
          )}
          style={{  }}
        >
          <Plus size={16} />
          Créer une publication
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================
 * PAGINATION FOOTER
 * ============================================================ */

function PaginationFooter({
  canLoadMore,
  loadingMore,
  count,
  onLoadMore,
}: {
  canLoadMore: boolean;
  loadingMore: boolean;
  count: number;
  onLoadMore: () => void;
}) {
  if (loadingMore) {
    return (
      <View
        className="flex items-center justify-center gap-1.5 py-5"
        accessibilityLabel="Chargement de publications supplémentaires"
        aria-busy="true"
      >
        {[0, 1, 2].map((index) => (
          <Text
            key={index}
            className="h-2 w-2 rounded-full bg-violet-400"
          />
        ))}
      </View>
    );
  }

  if (canLoadMore) {
    return (
      <View className="flex justify-center px-4 pb-5 pt-1">
        <Pressable
          onPress={onLoadMore}
          className={cn(
            "flex items-center gap-2 rounded-2xl",
            "px-5 py-2.5",
            "text-sm font-semibold text-white/65",
            "cursor-pointer transition-all",
            "hover:text-white",
          )}
          style={{ backgroundColor: "rgba(255,255,255,0.065)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          <RefreshCw size={14} />
          Charger plus
        </Pressable>
      </View>
    );
  }

  if (count > 0) {
    return (
      <View className="flex items-center justify-center gap-2 px-4 py-5">
        <Text className="h-px w-8 bg-white/10" />
        <Text className="text-xs text-white/25">Vous avez tout vu</Text>
        <Text className="h-px w-8 bg-white/10" />
      </View>
    );
  }

  return null;
}

/* ============================================================
 * PROPS
 * ============================================================ */

interface PersonalizedFeedProps {
  onNavigate: (page: string) => void;
  onCreateOpen: () => void;
  onViewProfile: (userId: string) => void;
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function PersonalizedFeed({
  onCreateOpen,
}: PersonalizedFeedProps) {
  const [activeType, setActiveType] = useState<FilterType>("all");

  const [commentsItem, setCommentsItem] = useState<Publication | null>(null);

  const { handleAction, handleCTA } = usePublicationActions();

  /* ----------------------------------------------------------
   * QUERY
   * ---------------------------------------------------------- */

  const queryType = activeType !== "all" ? mapTypeToAPI(activeType) : undefined;

  const { feed, loading, loadingMore, canLoadMore, loadMore } = useHomeFeed({
    type: queryType,
  });

  /* ----------------------------------------------------------
   * MUTATIONS
   * ---------------------------------------------------------- */

  const likePublication = useMutation(api.publications.likePublication);

  const deletePublication = useMutation(api.publications.deletePublication);

  /* ----------------------------------------------------------
   * PUBLICATIONS
   * ---------------------------------------------------------- */

  const publications = useMemo<Publication[]>(() => {
    if (!Array.isArray(feed)) {
      return [];
    }

    const seen = new Set<string>();

    return feed.filter((item): item is Publication => {
      if (!isRenderablePublication(item)) {
        return false;
      }

      if (seen.has(item._id)) {
        return false;
      }

      seen.add(item._id);

      return true;
    });
  }, [feed]);

  /* ----------------------------------------------------------
   * LIKE
   * ---------------------------------------------------------- */

  const handleLike = useCallback(
    async (publicationId: Id<"publications">) => {
      try {
        await likePublication({
          publicationId,
        });
      } catch {
        UIService.openToast("Impossible de modifier la publication.", "error");
      }
    },
    [likePublication],
  );

  /* ----------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------- */

  const handleDelete = useCallback(
    async (publicationId: Id<"publications">) => {
      try {
        await deletePublication({
          publicationId,
        });

        UIService.openToast("Publication supprimée.", "success");
      } catch {
        UIService.openToast("Impossible de supprimer la publication.", "error");
      }
    },
    [deletePublication],
  );

  /* ----------------------------------------------------------
   * FILTER
   * ---------------------------------------------------------- */

  const handleFilterChange = useCallback(
    (type: FilterType) => {
      if (type === activeType) {
        return;
      }

      setCommentsItem(null);
      setActiveType(type);
    },
    [activeType],
  );

  /* ----------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------- */

  return (
    <View className="flex flex-col gap-0" accessibilityLabel="Fil personnalisé">
      {/* CATEGORY FILTER */}
      <View className="pb-3">
        <CategoryBar active={activeType} onChange={handleFilterChange} />
      </View>

      {/* FEED */}
      <>
        {loading ? (
          <View
            key="loading"
          >
            <FeedSkeleton />
          </View>
        ) : publications.length === 0 ? (
          <View
            key="empty"
          >
            <EmptyFeed activeType={activeType} onCreateOpen={onCreateOpen} />
          </View>
        ) : (
          <View
            key={`feed-${activeType}`}
            className="flex flex-col gap-4"
          >
            {publications.map((item, index) => (
              <View
                key={`${activeType}-${item._id}`}
              >
                <PublicationRenderer
                  publication={item}
                  index={index}
                  onLike={() => {
                    void handleLike(item._id);
                  }}
                  onDelete={() => {
                    void handleDelete(item._id);
                  }}
                  onAction={(actionId) => handleAction(actionId, item)}
                  onCTA={() => handleCTA(item)}
                  actionsSlot={
                    <View className="flex items-center gap-2">
                      <CommentsButton
                        count={item.commentCount ?? 0}
                        onPress={() => setCommentsItem(item)}
                      />

                      <BookmarkButton publicationId={item._id} />
                    </View>
                  }
                />
              </View>
            ))}

            {/* PAGINATION */}
            <PaginationFooter
              canLoadMore={canLoadMore}
              loadingMore={loadingMore}
              count={publications.length}
              onLoadMore={() => {
                void loadMore();
              }}
            />
          </View>
        )}
      </>

      {/* COMMENTS */}
      <CommentsSheet
        open={commentsItem !== null}
        onClose={() => setCommentsItem(null)}
        publicationId={commentsItem?._id ?? null}
        publicationTitle={commentsItem?.title}
      />
    </View>
  );
}
