// src/pages/home/_components/LiveFeed.tsx

import {
  View,
  Pressable,
  Text,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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
 * ENTRANCE WRAPPER
 * ========================================================================== */

function FadeUp({
  delay = 0,
  distance = 14,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * PULSING SPARKLE — HEADER ICON
 * ========================================================================== */

function PulsingHeaderIcon({
  activeType,
}: {
  activeType: PublicationType | "all";
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <Animated.View
      style={[
        styles.headerIconWrap,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <LinearGradient
        colors={["#A78BFA", "#7C3AED", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerIconGradient}
      >
        {activeType === "all" ? <Sparkles /> : <LayoutGrid />}
      </LinearGradient>
    </Animated.View>
  );
}

/* ============================================================================
 * FILTER CHIP
 * ========================================================================== */

function FilterChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(activeAnim, {
      toValue: active ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, activeAnim]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  /*
   * Native Animated does not safely type string color interpolation here.
   * The active state is therefore represented by a deterministic native color,
   * while the gradient opacity remains animated.
   */
  const borderColor = active
    ? "rgba(255,255,255,0.15)"
    : "rgba(255,255,255,0.09)";

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={styles.filterChip}
      >
        {/* Base background */}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.045)",
              borderWidth: 1,
              borderColor,
            },
          ]}
        />

        {/* Active gradient overlay */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: activeAnim,
              borderRadius: 12,
              overflow: "hidden",
              shadowColor: color,
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: {
                width: 0,
                height: 6,
              },
            },
          ]}
        >
          <LinearGradient
            colors={[`${color}E6`, `${color}AA`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Text
          style={[
            styles.filterChipText,
            {
              color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * LIVE FEED SKELETON
 * ========================================================================== */

function LiveFeedSkeleton() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <View
      accessibilityLabel="Chargement du fil"
      accessibilityState={{ busy: true }}
      style={{ gap: 16 }}
    >
      {[0, 1, 2].map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeletonCard,
            {
              opacity,
            },
          ]}
        >
          <Skeleton style={styles.skeletonHero} />

          <View style={styles.skeletonBody}>
            <View style={styles.skeletonAuthorRow}>
              <Skeleton style={styles.skeletonAvatar} />

              <View
                style={{
                  flex: 1,
                  gap: 8,
                }}
              >
                <Skeleton style={styles.skeletonLine1} />
                <Skeleton style={styles.skeletonLine2} />
              </View>
            </View>

            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonText} />
            <Skeleton style={styles.skeletonTextShort} />

            <View style={styles.skeletonActionsRow}>
              <Skeleton style={styles.skeletonAction} />
              <Skeleton style={styles.skeletonAction} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

/* ============================================================================
 * EMPTY FEED
 * ========================================================================== */

function EmptyFeed({
  activeType,
  onCreateOpen,
  onReset,
}: {
  activeType: PublicationType | "all";
  onCreateOpen: () => void;
  onReset: () => void;
}) {
  const isFiltered = activeType !== "all";
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const rotate = float.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0deg", "3deg", "-3deg"],
  });

  return (
    <FadeUp distance={15}>
      <View style={styles.emptyCard}>
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.14)",
            "rgba(15,7,32,0.6)",
            "rgba(10,6,24,0.85)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.emptyBorder} pointerEvents="none" />

        <View style={styles.emptyOrb} pointerEvents="none" />

        <View style={styles.emptyContent}>
          <Animated.View
            style={[
              styles.emptyIconWrap,
              {
                transform: [{ translateY }, { rotate }],
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(167,139,250,0.32)", "rgba(99,102,241,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconGradient}
            >
              {isFiltered ? <LayoutGrid /> : <Sparkles />}
            </LinearGradient>
          </Animated.View>

          <Text style={styles.emptyTitle}>
            {isFiltered
              ? "Rien dans cette catégorie"
              : "Le feed est encore calme"}
          </Text>

          <Text style={styles.emptySub}>
            {isFiltered
              ? "Aucune publication disponible dans cette catégorie pour le moment. Explore les autres catégories ou sois le premier à publier."
              : "Il n'y a encore aucune publication à afficher. Crée la première et fais découvrir quelque chose à ta communauté."}
          </Text>

          <View style={styles.emptyActions}>
            {isFiltered ? (
              <Pressable
                onPress={onReset}
                style={({ pressed }) => [
                  styles.emptySecondaryBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.emptySecondaryText}>Explorer tout</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onCreateOpen}
              style={({ pressed }) => [
                styles.emptyPrimaryOuter,
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyPrimary}
              >
                <Plus />

                <Text style={styles.emptyPrimaryText}>
                  Créer une publication
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </FadeUp>
  );
}

/* ============================================================================
 * LOADING DOTS
 * ========================================================================== */

function LoadingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),

          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),

          Animated.delay((2 - i) * 140),
        ]),
      ),
    );

    animations.forEach((animation) => {
      animation.start();
    });

    return () => {
      animations.forEach((animation) => {
        animation.stop();
      });
    };
  }, [dots]);

  return (
    <View
      style={styles.loadingDotsRow}
      accessibilityLabel="Chargement des publications"
    >
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.loadingDot,
            {
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 1],
              }),

              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

/* ============================================================================
 * REFRESH SPINNER
 * ========================================================================== */

function RefreshSpinner({ active }: { active: boolean }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      rotate.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        transform: [{ rotate: rotation }],
      }}
    >
      <RefreshCw />
    </Animated.View>
  );
}

/* ============================================================================
 * FEED PAGINATION
 * ========================================================================== */

function FeedPagination({
  canLoadMore,
  isLoadingMore,
  isExhausted,
  count,
  onLoadMore,
}: {
  canLoadMore: boolean;
  isLoadingMore: boolean;
  isExhausted: boolean;
  count: number;
  onLoadMore: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <View style={styles.paginationWrap}>
      {canLoadMore ? (
        <Animated.View
          style={{
            transform: [{ scale }],
          }}
        >
          <Pressable
            onPress={onLoadMore}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={isLoadingMore}
            style={({ pressed }) => [
              styles.loadMoreBtn,
              pressed && !isLoadingMore && styles.pressed,
              isLoadingMore && { opacity: 0.6 },
            ]}
          >
            <RefreshSpinner active={isLoadingMore} />

            <Text style={styles.loadMoreText}>
              {isLoadingMore ? "Chargement…" : "Charger plus"}
            </Text>

            {!isLoadingMore ? <ChevronRight /> : null}
          </Pressable>
        </Animated.View>
      ) : null}

      {isLoadingMore ? <LoadingDots /> : null}

      {isExhausted && count > 0 ? (
        <FadeUp distance={6}>
          <View style={styles.exhaustedRow}>
            <View style={styles.exhaustedLine} />

            <Text style={styles.exhaustedText}>Vous avez tout vu</Text>

            <View style={styles.exhaustedLine} />
          </View>
        </FadeUp>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function LiveFeed({ onNavigate, onCreateOpen }: LiveFeedProps) {
  const [activeType, setActiveType] = useState<PublicationType | "all">("all");

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  /* --------------------------------------------------------------------------
   * BACKEND
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

  /*
   * Kept in the public component contract for compatibility
   * with the parent navigation architecture.
   */
  void onNavigate;

  /* --------------------------------------------------------------------------
   * DERIVED
   * ------------------------------------------------------------------------ */

  const visibleResults = useMemo(() => {
    return results.filter((item) => !item.isHidden);
  }, [results]);

  const visibleCount = visibleResults.length;

  /* --------------------------------------------------------------------------
   * LIKE
   * ------------------------------------------------------------------------ */

  const handleLike = async (id: string) => {
    if (actionInProgress === `like:${id}`) {
      return;
    }

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
    if (actionInProgress === `delete:${id}`) {
      return;
    }

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
    if (type === activeType) {
      return;
    }

    setActiveType(type);
    setActionInProgress(null);
  };

  /* --------------------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------------------ */

  const isLoading = status === "LoadingFirstPage";

  const isLoadingMore = status === "LoadingMore";

  const canLoadMore = status === "CanLoadMore";

  const isExhausted = status === "Exhausted";

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <View style={styles.root} accessibilityLabel="Fil d'actualité">
      {/* ═════════════════ HEADER ═════════════════ */}

      <View style={styles.headerWrap}>
        <LinearGradient
          colors={["rgba(6,6,18,0.96)", "rgba(6,6,18,0.72)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.headerBorder} pointerEvents="none" />

        <View style={styles.headerInner}>
          {/* Row 1 */}

          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <PulsingHeaderIcon activeType={activeType} />

              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {activeType === "all"
                    ? "À découvrir"
                    : (TYPE_LABELS[activeType] ?? "Publications")}
                </Text>

                <Text style={styles.headerSub} numberOfLines={1}>
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
              onPress={onCreateOpen}
              accessibilityLabel="Créer une publication"
              style={({ pressed }) => [
                styles.publishBtn,
                pressed && styles.pressed,
              ]}
            >
              <Plus />

              <Text style={styles.publishBtnText}>Publier</Text>
            </Pressable>
          </View>

          {/* Row 2 — filters */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            accessibilityLabel="Catégories de publications"
          >
            <FilterChip
              label="Tout"
              active={activeType === "all"}
              color="#8B5CF6"
              onPress={() => handleTypeChange("all")}
            />

            {PUBLICATION_TYPES.map((type) => (
              <FilterChip
                key={type.value}
                label={type.label}
                active={activeType === type.value}
                color={
                  type.value === "all"
                    ? "#8B5CF6"
                    : (TYPE_COLORS[type.value] ?? type.color)
                }
                onPress={() => handleTypeChange(type.value)}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ═════════════════ CONTENT ═════════════════ */}

      <View style={styles.content}>
        {isLoading ? <LiveFeedSkeleton /> : null}

        {!isLoading && visibleResults.length === 0 ? (
          <EmptyFeed
            activeType={activeType}
            onCreateOpen={onCreateOpen}
            onReset={() => handleTypeChange("all")}
          />
        ) : null}

        {!isLoading && visibleResults.length > 0 ? (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 16 }}>
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
                  <FadeUp
                    key={item._id}
                    delay={index < 5 ? index * 25 : 0}
                    distance={18}
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
                  </FadeUp>
                );
              })}
            </View>

            <FeedPagination
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              isExhausted={isExhausted}
              count={visibleCount}
              onLoadMore={() => loadMore(PAGE_SIZE)}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },

  pressed: {
    opacity: 0.85,
  },

  /* ── Header ─────────────────────────────────────── */

  headerWrap: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    zIndex: 20,
  },

  headerBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  headerInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerIconWrap: {
    width: 38,
    height: 38,
  },

  headerIconGradient: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },

  headerSub: {
    marginTop: 2,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },

  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },

  publishBtnText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#DDD6FE",
    letterSpacing: 0.1,
  },

  /* ── Filters ────────────────────────────────────── */

  filtersRow: {
    gap: 8,
    paddingRight: 16,
  },

  filterChip: {
    height: 36,
    minWidth: 60,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden",
  },

  filterChipText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.1,
    zIndex: 10,
  },

  /* ── Content ────────────────────────────────────── */

  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },

  /* ── Skeleton ───────────────────────────────────── */

  skeletonCard: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  skeletonHero: {
    height: 200,
    width: "100%",
    borderRadius: 0,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonBody: {
    padding: 16,
    gap: 12,
  },

  skeletonAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonLine1: {
    height: 12,
    width: 110,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonLine2: {
    height: 10,
    width: 80,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonTitle: {
    height: 16,
    width: "75%",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  skeletonText: {
    height: 12,
    width: "100%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonTextShort: {
    height: 12,
    width: "83%",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonActionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
  },

  skeletonAction: {
    height: 32,
    width: 80,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  /* ── Empty ──────────────────────────────────────── */

  emptyCard: {
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,6,24,0.55)",
  },

  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
  },

  emptyOrb: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: 200,
    height: 200,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
  },

  emptyContent: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },

  emptyIconWrap: {
    marginBottom: 20,
  },

  emptyIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.3,
  },

  emptySub: {
    marginTop: 10,
    maxWidth: 340,
    fontSize: 12,
    lineHeight: 19,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontWeight: "500",
  },

  emptyActions: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  emptySecondaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  emptySecondaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.2,
  },

  emptyPrimaryOuter: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    elevation: 8,
  },

  emptyPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  emptyPrimaryText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  /* ── Pagination ─────────────────────────────────── */

  paginationWrap: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },

  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  loadMoreText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.2,
  },

  loadingDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A78BFA",
  },

  exhaustedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },

  exhaustedLine: {
    height: 1,
    width: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  exhaustedText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.2,
  },
});
