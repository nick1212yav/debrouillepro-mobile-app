import { View, Pressable, Text } from "react-native";
import { useMemo, useState } from "react";
import {
  RefreshCw,
  Plus,
  Sparkles,
  ChevronRight,
  LayoutGrid,
} from "lucide-react-native";

import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { PublicationCard } from "@/features/publications";
import type { Publication } from "@/features/publications/types";
import { usePublicationActions } from "@/features/publications/hooks/usePublicationActions";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  PUBLICATION_TYPES,
  TYPE_LABELS,
  TYPE_COLORS,
} from "@/hooks/use-publications";

import type { PublicationType } from "@/hooks/use-publications";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface LiveFeedProps {
  onNavigate: (page: string) => void;
  onCreateOpen: () => void;
}

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const PAGE_SIZE = 10;

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function LiveFeed({ onNavigate, onCreateOpen }: LiveFeedProps) {
  const [activeType, setActiveType] = useState<PublicationType | "all">("all");

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  /* --------------------------------------------------------------------------
   * BACKEND — SOURCE UNIQUE DE VÉRITÉ
   * ------------------------------------------------------------------------ */

  const { results, status, loadMore } = usePaginatedQuery(
    api.publications.listFeed,
    activeType !== "all" ? { type: activeType } : {},
    {
      initialNumItems: PAGE_SIZE,
    },
  );

  const likePublication = useMutation(api.publications.likePublication);

  const deletePublication = useMutation(api.publications.deletePublication);

  const { handleAction, handleCTA } = usePublicationActions();

  /* --------------------------------------------------------------------------
   * DERIVED DATA
   *
   * Aucune génération locale.
   * On ne fait que filtrer les résultats réellement renvoyés
   * par Convex.
   * ------------------------------------------------------------------------ */

  const visibleResults = useMemo(() => {
    return results.filter((item) => !item.isHidden);
  }, [results]);

  /* --------------------------------------------------------------------------
   * CATEGORY COUNT
   * ------------------------------------------------------------------------ */

  const visibleCount = visibleResults.length;

  /* --------------------------------------------------------------------------
   * LIKE
   * ------------------------------------------------------------------------ */

  const handleLike = async (id: string) => {
    if (actionInProgress === `like:${id}`) return;

    setActionInProgress(`like:${id}`);

    try {
      await likePublication({
        publicationId: id as Parameters<
          typeof likePublication
        >[0]["publicationId"],
      });
    } catch (error) {
      console.error("[LiveFeed] Impossible de liker la publication :", error);
    } finally {
      setActionInProgress(null);
    }
  };

  /* --------------------------------------------------------------------------
   * DELETE
   * ------------------------------------------------------------------------ */

  const handleDelete = async (id: string) => {
    if (actionInProgress === `delete:${id}`) return;

    setActionInProgress(`delete:${id}`);

    try {
      await deletePublication({
        publicationId: id as Parameters<
          typeof deletePublication
        >[0]["publicationId"],
      });
    } catch (error) {
      console.error(
        "[LiveFeed] Impossible de supprimer la publication :",
        error,
      );
    } finally {
      setActionInProgress(null);
    }
  };

  /* --------------------------------------------------------------------------
   * FILTER
   * ------------------------------------------------------------------------ */

  const handleTypeChange = (type: PublicationType | "all") => {
    if (type === activeType) return;

    setActiveType(type);

    /*
     * La requête paginée est automatiquement recalculée par Convex
     * lorsque ses arguments changent.
     */
    setActionInProgress(null);
  };

  /* --------------------------------------------------------------------------
   * LOADING
   * ------------------------------------------------------------------------ */

  const isLoading = status === "LoadingFirstPage";

  const isLoadingMore = status === "LoadingMore";

  const canLoadMore = status === "CanLoadMore";

  const isExhausted = status === "Exhausted";

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <View
      className="relative flex w-full flex-col"
      accessibilityLabel="Fil d'actualité"
    >
      {/* =====================================================================
          HEADER / FILTERS
      ====================================================================== */}

      <View className="sticky top-0 z-20 border-b border-white/[0.04] bg-[#060612]/80">
        <View className="px-4 pt-2 sm:px-5">
          {/* -----------------------------------------------------------------
              SECTION HEADER
          ------------------------------------------------------------------ */}

          <View className="flex items-center justify-between gap-3 pb-3">
            <View className="flex min-w-0 items-center gap-3">
              <View
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10"
              >
                {activeType === "all" ? (
                  <Sparkles
                    className="h-4 w-4 text-violet-300"
                    accessibilityElementsHidden={true}
                  />
                ) : (
                  <LayoutGrid
                    className="h-4 w-4 text-violet-300"
                    accessibilityElementsHidden={true}
                  />
                )}
              </View>

              <View className="min-w-0">
                <Text className="truncate text-sm font-bold text-white">
                  {activeType === "all"
                    ? "À découvrir"
                    : (TYPE_LABELS[activeType] ?? "Publications")}
                </Text>

                <Text className="truncate text-[10px] text-white/35">
                  {isLoading
                    ? "Chargement du feed…"
                    : visibleCount > 0
                      ? `${visibleCount} publication${
                          visibleCount > 1 ? "s" : ""
                        } affichée${visibleCount > 1 ? "s" : ""}`
                      : "Découvrez ce qui se passe autour de vous"}
                </Text>
              </View>
            </View>

            <Pressable
              type="button"
              onPress={onCreateOpen}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 text-[10px] font-bold text-violet-200"
              accessibilityLabel="Créer une publication"
            >
              <Plus className="h-3.5 w-3.5" accessibilityElementsHidden={true} />

              <Text className="hidden xs:inline">Publier</Text>
            </Pressable>
          </View>

          {/* -----------------------------------------------------------------
              CATEGORY NAVIGATION
          ------------------------------------------------------------------ */}

          <View
            className="relative -mx-4 overflow-x-auto px-4 pb-3 scrollbar-none sm:-mx-5 sm:px-5"
            accessibilityRole="tablist"
            accessibilityLabel="Catégories de publications"
          >
            <View className="flex min-w-max items-center gap-2">
              {/* ALL */}

              <FilterChip
                label="Tout"
                active={activeType === "all"}
                color="#8b5cf6"
                onPress={() => handleTypeChange("all")}
              />

              {/* TYPES */}

              {PUBLICATION_TYPES.map((type) => (
                <FilterChip
                  key={type.value}
                  label={type.label}
                  active={activeType === type.value}
                  color={
                    type.value === "all"
                      ? "#8b5cf6"
                      : (TYPE_COLORS[type.value] ?? type.color)
                  }
                  onPress={() => handleTypeChange(type.value)}
                />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* =====================================================================
          FEED CONTENT
      ====================================================================== */}

      <View className="relative pt-4">
        {/* -------------------------------------------------------------------
            FIRST LOAD
        -------------------------------------------------------------------- */}

        {isLoading && <LiveFeedSkeleton />}

        {/* -------------------------------------------------------------------
            EMPTY
        -------------------------------------------------------------------- */}

        {!isLoading && visibleResults.length === 0 && (
          <EmptyFeed
            activeType={activeType}
            onCreateOpen={onCreateOpen}
            onReset={() => handleTypeChange("all")}
          />
        )}

        {/* -------------------------------------------------------------------
            PUBLICATIONS
        -------------------------------------------------------------------- */}

        {!isLoading && visibleResults.length > 0 && (
          <View className="flex flex-col gap-4">
            <>
              {visibleResults.map((item, index) => {
                const publication: Publication = {
                  ...item,

                  author: {
                    id: item.authorId,
                    name: item.author?.name ?? "Utilisateur",
                    avatar: item.author?.avatar,
                  },

                  isMine: "isMine" in item ? Boolean(item.isMine) : false,
                };
                return (
                  <View
                    key={item._id}
                  >
                    <PublicationCard
                      publication={publication}
                      index={index}
                      onLike={() => handleLike(item._id)}
                      onDelete={() => handleDelete(item._id)}
                      onAction={(actionId) =>
                        handleAction(actionId, publication)
                      }
                      onCTA={() => handleCTA(publication)}
                    />
                  </View>
                );
              })}
            </>

            {/* ---------------------------------------------------------------
                  PAGINATION
              ---------------------------------------------------------------- */}

            <FeedPagination
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              isExhausted={isExhausted}
              count={visibleCount}
              onLoadMore={() => loadMore(PAGE_SIZE)}
            />
          </View>
        )}
      </View>
    </View>
  );
}

/* ============================================================================
 * FILTER CHIP
 * ========================================================================== */

interface FilterChipProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}

function FilterChip({ label, active, color, onClick }: FilterChipProps) {
  return (
    <Pressable
      type="button"
      accessibilityRole="tab"
      aria-selected={active}
      onPress={onClick}
      className={cn(
        "relative flex h-9 shrink-0 items-center overflow-hidden rounded-xl border px-3.5 text-[10px] font-bold transition-all",
        active
          ? "border-transparent text-white shadow-lg"
          : "border-white/[0.08] bg-white/[0.045] text-white/40 hover:border-white/15 hover:bg-white/[0.07] hover:text-white/65",
      )}
      style={
        active
          ? {  }
          : undefined
      }
    >
      {active && (
        <Text
          className="absolute inset-0 rounded-xl"
          style={{  }}
        />
      )}

      <Text className="relative z-10">{label}</Text>
    </Pressable>
  );
}

/* ============================================================================
 * SKELETON
 * ========================================================================== */

function LiveFeedSkeleton() {
  return (
    <View
      className="flex flex-col gap-4 px-0"
      accessibilityLabel="Chargement du fil"
     
    >
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          className="overflow-hidden rounded-[1.75rem] border border-white/[0.06] bg-white/[0.025]"
        >
          <Skeleton className="h-52 w-full rounded-none bg-white/[0.06]" />

          <View className="space-y-3 p-4">
            <View className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full bg-white/[0.06]" />

              <View className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28 rounded-full bg-white/[0.06]" />
                <Skeleton className="h-2.5 w-20 rounded-full bg-white/[0.06]" />
              </View>
            </View>

            <Skeleton className="h-4 w-3/4 rounded-full bg-white/[0.06]" />

            <Skeleton className="h-3 w-full rounded-full bg-white/[0.06]" />

            <Skeleton className="h-3 w-5/6 rounded-full bg-white/[0.06]" />

            <View className="flex gap-2 pt-1">
              <Skeleton className="h-8 w-20 rounded-xl bg-white/[0.06]" />
              <Skeleton className="h-8 w-20 rounded-xl bg-white/[0.06]" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

interface EmptyFeedProps {
  activeType: PublicationType | "all";
  onCreateOpen: () => void;
  onReset: () => void;
}

function EmptyFeed({ activeType, onCreateOpen, onReset }: EmptyFeedProps) {
  const isFiltered = activeType !== "all";

  return (
    <View
      className="mx-4 overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025] sm:mx-0"
    >
      <View className="relative px-6 py-10 text-center">
        {/* Ambient decoration */}

        <View className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-violet-500/10" />

        <View
          className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-violet-400/15 bg-violet-500/10"
        >
          {isFiltered ? (
            <LayoutGrid className="h-7 w-7 text-violet-300" />
          ) : (
            <Sparkles className="h-7 w-7 text-violet-300" />
          )}
        </View>

        <Text className="relative text-base font-bold text-white">
          {isFiltered
            ? "Rien dans cette catégorie"
            : "Le feed est encore calme"}
        </Text>

        <Text className="relative mx-auto mt-2 max-w-sm text-xs leading-5 text-white/40">
          {isFiltered
            ? "Aucune publication disponible dans cette catégorie pour le moment. Explore les autres catégories ou sois le premier à publier."
            : "Il n'y a encore aucune publication à afficher. Crée la première et fais découvrir quelque chose à ta communauté."}
        </Text>

        <View className="relative mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          {isFiltered && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onPress={onReset}
              className="h-10 rounded-xl border-white/10 bg-white/5 px-4 text-xs text-white"
            >
              <Text>Explorer tout</Text></Button>
          )}

          <Button
            type="button"
            size="sm"
            onPress={onCreateOpen}
            className="h-10 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-lg shadow-violet-600/20"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <Text>Créer une publication</Text></Button>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * PAGINATION
 * ========================================================================== */

interface FeedPaginationProps {
  canLoadMore: boolean;
  isLoadingMore: boolean;
  isExhausted: boolean;
  count: number;
  onLoadMore: () => void;
}

function FeedPagination({
  canLoadMore,
  isLoadingMore,
  isExhausted,
  count,
  onLoadMore,
}: FeedPaginationProps) {
  return (
    <View className="flex flex-col items-center gap-3 pb-6 pt-1">
      {canLoadMore && (
        <Pressable
          type="button"
          onPress={onLoadMore}
          disabled={isLoadingMore}
          className="group flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-5 text-xs font-bold text-white/65 shadow-lg disabled:pointer-events-none disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              isLoadingMore && "animate-spin",
            )}
          />

          {isLoadingMore ? "Chargement…" : "Charger plus"}

          {!isLoadingMore && (
            <ChevronRight className="h-3.5 w-3.5 opacity-40" />
          )}
        </Pressable>
      )}

      {isLoadingMore && (
        <View
          className="flex items-center gap-1.5"
          accessibilityLabel="Chargement des publications"
        >
          {[0, 1, 2].map((index) => (
            <Text
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-violet-400"
            />
          ))}
        </View>
      )}

      {isExhausted && count > 0 && (
        <View
          className="flex items-center gap-2 py-2"
        >
          <Text className="h-px w-8 bg-white/10" />

          <Text className="text-[10px] font-medium text-white/25">
            Vous avez tout vu
          </Text>

          <Text className="h-px w-8 bg-white/10" />
        </View>
      )}
    </View>
  );
}
