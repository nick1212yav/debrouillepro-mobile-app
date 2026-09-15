// src/pages/home/_components/Stories.tsx
import {
  Text,
  Pressable,
  View,
  Image as RNImage,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Plus, RefreshCw, Sparkles } from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api.js";

import StoryViewer from "./StoryViewer.tsx";
import StoryCreator from "./StoryCreator.tsx";

import type { StoryGroup, StorySlide } from "./StoryViewer.tsx";

/* ============================================================
 * PROPS
 * ============================================================ */

interface StoriesProps {
  className?: string;
}

/* ============================================================
 * TYPES BACKEND
 * ============================================================ */

type BackendStory = {
  _id: string;
  _creationTime: number;
  authorId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  duration?: number;
  viewCount: number;
  expiresAt: string;
  isHighlight: boolean;
  authorName: string;
  authorAvatar?: string;
  authorCity?: string;
  viewed: boolean;
};

type BackendStoryGroup = {
  author: {
    id: string;
    name: string;
    avatar?: string;
    city?: string;
  };
  stories: BackendStory[];
  hasUnviewed: boolean;
  unreadCount?: number;
  latestAt?: number;
  score?: number;
};

type StoryGroupWithUnread = StoryGroup & {
  unreadCount?: number;
};

type StoryPublishSlide = Omit<
  StorySlide,
  "id" | "authorName" | "authorAvatar" | "authorGradient" | "time"
> & {
  duration?: number;
};

/* ============================================================
 * HELPERS
 * ============================================================ */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (
    parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)
  ).toUpperCase();
}

function formatStoryTime(creationTime: number): string {
  const diff = Math.max(0, Date.now() - creationTime);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function isVideo(story: BackendStory): boolean {
  return story.mediaType === "video";
}

/* ============================================================
 * BACKEND → UI
 * ============================================================ */

function mapStorySlide(story: BackendStory): StorySlide {
  return {
    id: String(story._id),
    type: isVideo(story) ? "video" : "image",
    bg: "#050812",
    img: story.mediaUrl,
    text: story.caption ?? "",
    authorName: story.authorName,
    authorAvatar: story.authorAvatar,
    time: formatStoryTime(story._creationTime),
  } as StorySlide;
}

function mapStoryGroup(group: BackendStoryGroup): StoryGroupWithUnread {
  return {
    id: String(group.author.id),
    authorName: group.author.name,
    authorAvatar: group.author.avatar,
    seen: !group.hasUnviewed,
    slides: group.stories.map(mapStorySlide),
    unreadCount: group.unreadCount,
  };
}

/* ============================================================
 * FADE UP WRAPPER
 * ============================================================ */

function FadeUp({
  delay = 0,
  distance = 8,
  scale = 1,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  scale?: number;
  children: ReactNode;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      stiffness: 320,
      damping: 24,
      useNativeDriver: true,
    }).start();
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
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [scale, 1],
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

/* ============================================================
 * SPARKLE BADGE (Plus)
 * ============================================================ */

function SparkleBadge() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Animated.View
      style={[styles.sparkleBadge, { transform: [{ scale }], opacity }]}
    >
      <Sparkles size={9} color="#7C3AED" strokeWidth={2.6} />
    </Animated.View>
  );
}

/* ============================================================
 * PULSE RING (unread story)
 * ============================================================ */

function PulseRing() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulseRing, { transform: [{ scale }], opacity }]}
    />
  );
}

/* ============================================================
 * SPINNER
 * ============================================================ */

function RefreshSpinner({ active }: { active: boolean }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      rotate.setValue(0);
      return;
    }
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [active, rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <RefreshCw size={12} color="rgba(255,255,255,0.55)" strokeWidth={2.4} />
    </Animated.View>
  );
}

/* ============================================================
 * LOADING SKELETON
 * ============================================================ */

function StoriesSkeleton({ className }: { className?: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <View
      style={[styles.root, styles.skeletonRoot]}
      accessibilityLabel="Stories"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.skeletonHeaderTitle, { opacity }]} />
          <Animated.View style={[styles.skeletonHeaderDot, { opacity }]} />
        </View>
      </View>

      {/* Scroll row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
        accessibilityElementsHidden
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.skeletonItem}>
            <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
            <Animated.View style={[styles.skeletonLabel, { opacity }]} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ============================================================
 * STORY AVATAR (main state)
 * ============================================================ */

function StoryAvatar({
  group,
  index,
  onPress,
}: {
  group: StoryGroupWithUnread;
  index: number;
  onPress: () => void;
}) {
  const isSeen = group.seen;
  const isNew = !isSeen;
  const firstLetter = getInitials(group.authorName);

  const scale = useRef(new Animated.Value(1)).current;

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

  return (
    <FadeUp delay={40 * index} distance={8} scale={0.8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityLabel={`Voir les stories de ${group.authorName}`}
          style={styles.avatarPress}
        >
          <View style={styles.avatarOuter}>
            {/* Pulse ring if unread */}
            {isNew ? <PulseRing /> : null}

            {/* Ring (gradient if unread, dim if seen) */}
            <View style={styles.avatarRingWrap}>
              {isNew ? (
                <LinearGradient
                  colors={["#A78BFA", "#7C3AED", "#6366F1", "#C4B5FD"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarRingGradient}
                />
              ) : (
                <View style={styles.avatarRingSeen} />
              )}

              <View style={styles.avatarInner}>
                {group.authorAvatar ? (
                  <RNImage
                    source={{ uri: group.authorAvatar }}
                    style={styles.avatarImage}
                    accessibilityLabel=""
                  />
                ) : (
                  <LinearGradient
                    colors={["#7C3AED", "#6366F1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarInitialsWrap}
                  >
                    <Text style={styles.avatarInitialsText}>{firstLetter}</Text>
                  </LinearGradient>
                )}
              </View>
            </View>

            {/* Unread dot */}
            {isNew ? <View style={styles.unreadDot} /> : null}

            {/* Unread count badge */}
            {group.unreadCount && group.unreadCount > 1 ? (
              <View style={styles.unreadCountBadge}>
                <Text style={styles.unreadCountText}>{group.unreadCount}</Text>
              </View>
            ) : null}
          </View>

          <Text
            style={[
              styles.avatarLabel,
              {
                color: isSeen
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(255,255,255,0.8)",
              },
            ]}
            numberOfLines={1}
          >
            {group.authorName.split(" ")[0]}
          </Text>
        </Pressable>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================
 * ADD STORY BUTTON
 * ============================================================ */

function AddStoryButton({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

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

  return (
    <FadeUp distance={8} scale={0.8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityLabel="Ajouter une story"
          style={styles.avatarPress}
        >
          <View style={styles.avatarOuter}>
            <View style={styles.addRingWrap}>
              <LinearGradient
                colors={["rgba(167,139,250,0.5)", "rgba(99,102,241,0.25)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addRingGradient}
              >
                <View style={styles.addInner}>
                  <LinearGradient
                    colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addIconWrap}
                  >
                    <Plus size={17} color="#fff" strokeWidth={2.6} />
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>
            <SparkleBadge />
          </View>

          <Text style={styles.addLabel}>Ajouter</Text>
        </Pressable>
      </Animated.View>
    </FadeUp>
  );
}

/* ============================================================
 * EMPTY STATE
 * ============================================================ */

function EmptyState({
  className,
  onOpenCreator,
}: {
  className?: string;
  onOpenCreator: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

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

  return (
    <View
      style={[styles.root, className ? undefined : undefined]}
      accessibilityLabel="Stories"
    >
      <View style={styles.emptyCard}>
        <LinearGradient
          colors={[
            "rgba(167,139,250,0.2)",
            "rgba(99,102,241,0.08)",
            "rgba(15,7,32,0.85)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emptyBorder} pointerEvents="none" />
        <View style={styles.emptyOrb} pointerEvents="none" />

        <View style={styles.emptyRow}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable
              onPress={onOpenCreator}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              accessibilityLabel="Créer une story"
            >
              <LinearGradient
                colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyPlusBtn}
              >
                <Plus size={24} color="#fff" strokeWidth={2.6} />
              </LinearGradient>
              <SparkleBadge />
            </Pressable>
          </Animated.View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.emptyTitle}>Crée ta première story</Text>
            <Text style={styles.emptySub}>
              Partage ce que tu vis, fais découvrir ton activité ou crée une
              opportunité.
            </Text>
          </View>

          <Pressable
            onPress={onOpenCreator}
            style={({ pressed }) => [
              styles.emptyCtaBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.emptyCtaText}>Créer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function Stories({ className }: StoriesProps) {
  const feed = useQuery(api.stories.getStoryFeed, {});
  const markViewed = useMutation(api.stories.markViewed);
  const createStory = useMutation(api.stories.createStory);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ───── normalisation ───── */
  const groups = useMemo<StoryGroupWithUnread[]>(() => {
    if (!feed) return [];
    const backendGroups = (feed.groups ?? []) as BackendStoryGroup[];
    return backendGroups
      .filter(
        (group) =>
          group.author &&
          Array.isArray(group.stories) &&
          group.stories.length > 0,
      )
      .map(mapStoryGroup);
  }, [feed]);

  /* ───── stats ───── */
  const totalStories = feed?.totalStories ?? 0;
  const totalGroups = feed?.totalGroups ?? 0;
  const unreadGroups = groups.filter((g) => !g.seen).length;

  /* ───── open viewer ───── */
  const openViewer = useCallback(
    (groupId: string) => {
      const index = groups.findIndex((g) => g.id === groupId);
      if (index === -1) return;
      setViewerGroupIndex(index);
      setViewerOpen(true);
    },
    [groups],
  );

  /* ───── mark viewed ───── */
  const handleMarkSeen = useCallback(
    async (groupId: string) => {
      const group = groups.find((item) => item.id === groupId);
      if (!group) return;

      for (const slide of group.slides) {
        try {
          await markViewed({ storyId: slide.id as never });
        } catch {
          // silent
        }
      }
    },
    [groups, markViewed],
  );

  /* ───── refresh ───── */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 450));
    setIsRefreshing(false);
  }, []);

  /* ───── publish ───── */
  const handlePublish = useCallback(
    async (slide: StoryPublishSlide) => {
      const mediaUrl = typeof slide.img === "string" ? slide.img : "";
      if (!mediaUrl) return;

      try {
        await createStory({
          mediaUrl,
          mediaType: "image",
          caption: typeof slide.text === "string" ? slide.text : undefined,
          duration:
            typeof slide.duration === "number" ? slide.duration : undefined,
        });
      } catch (error) {
        console.error("[Stories] Publish failed:", error);
      } finally {
        setCreatorOpen(false);
      }
    },
    [createStory],
  );

  /* ───── loading state ───── */
  if (feed === undefined) {
    return <StoriesSkeleton className={className} />;
  }

  /* ───── empty state ───── */
  if (groups.length === 0) {
    return (
      <>
        <EmptyState
          className={className}
          onOpenCreator={() => setCreatorOpen(true)}
        />

        {creatorOpen ? (
          <StoryCreator
            onClose={() => setCreatorOpen(false)}
            onPublish={handlePublish}
          />
        ) : null}
      </>
    );
  }

  /* ========================================================================
   * MAIN STATE
   * ====================================================================== */

  return (
    <>
      <View style={styles.root} accessibilityLabel="Stories">
        {/* ───── HEADER ───── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Stories</Text>
            {unreadGroups > 0 ? (
              <FadeUp distance={0} scale={0.7}>
                <View style={styles.headerUnreadBadge}>
                  <Text style={styles.headerUnreadText}>
                    {unreadGroups} nouvelle{unreadGroups > 1 ? "s" : ""}
                  </Text>
                </View>
              </FadeUp>
            ) : null}
          </View>

          <View style={styles.headerRight}>
            {totalStories > 0 ? (
              <Text style={styles.headerCount}>
                {totalStories} story{totalStories > 1 ? "s" : ""}
              </Text>
            ) : null}

            <Pressable
              onPress={refresh}
              disabled={isRefreshing}
              accessibilityLabel="Actualiser les stories"
              hitSlop={6}
              style={({ pressed }) => [
                styles.headerRefreshBtn,
                pressed && { opacity: 0.7 },
                isRefreshing && { opacity: 0.5 },
              ]}
            >
              <RefreshSpinner active={isRefreshing} />
            </Pressable>
          </View>
        </View>

        {/* ───── STORIES ROW ───── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollRow}
        >
          <AddStoryButton onPress={() => setCreatorOpen(true)} />

          {groups.map((group, index) => (
            <StoryAvatar
              key={group.id}
              group={group}
              index={index}
              onPress={() => openViewer(group.id)}
            />
          ))}
        </ScrollView>

        {/* ───── FOOTER HINT ───── */}
        {totalGroups > 0 ? (
          <FadeUp delay={200} distance={4}>
            <View style={styles.footerHint}>
              <View style={styles.footerHintDot} />
              <Text style={styles.footerHintText}>
                Stories personnalisées pour vous
              </Text>
            </View>
          </FadeUp>
        ) : null}
      </View>

      {/* ───── VIEWER ───── */}
      {viewerOpen ? (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerGroupIndex}
          onClose={() => setViewerOpen(false)}
          onMarkSeen={handleMarkSeen}
        />
      ) : null}

      {/* ───── CREATOR ───── */}
      {creatorOpen ? (
        <StoryCreator
          onClose={() => setCreatorOpen(false)}
          onPublish={handlePublish}
        />
      ) : null}
    </>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  root: {
    marginTop: 16,
    paddingHorizontal: 20,
  },

  /* ── Header ────────────────────────────────────── */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerUnreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.16)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  headerUnreadText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#DDD6FE",
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerCount: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  headerRefreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  /* ── Scroll row ────────────────────────────────── */
  scrollRow: {
    gap: 12,
    paddingBottom: 6,
  },

  /* ── Avatar / Add button ──────────────────────── */
  avatarPress: {
    alignItems: "center",
    gap: 6,
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRingWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 17,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRingGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
  },
  avatarRingSeen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  avatarInner: {
    width: AVATAR_SIZE - 3,
    height: AVATAR_SIZE - 3,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#0A0616",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitialsWrap: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialsText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.4,
  },
  avatarLabel: {
    maxWidth: 64,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  /* ── Pulse ring (unread) ─────────────────────── */
  pulseRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#A78BFA",
  },

  /* ── Unread dot ───────────────────────────────── */
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#A78BFA",
    borderWidth: 2.5,
    borderColor: "#070914",
    shadowColor: "#A78BFA",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },

  /* ── Unread count badge ───────────────────────── */
  unreadCountBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#070914",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadCountText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },

  /* ── Add story button ─────────────────────────── */
  addRingWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  addRingGradient: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    padding: 1.5,
  },
  addInner: {
    width: AVATAR_SIZE - 3,
    height: AVATAR_SIZE - 3,
    borderRadius: 15,
    backgroundColor: "#0A0616",
    alignItems: "center",
    justifyContent: "center",
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  addLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.1,
  },

  /* ── Sparkle badge ────────────────────────────── */
  sparkleBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#fff",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  /* ── Footer hint ──────────────────────────────── */
  footerHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  footerHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.75,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  footerHintText: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  /* ── Empty state ──────────────────────────────── */
  emptyCard: {
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.6)",
  },
  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },
  emptyOrb: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 130,
    height: 130,
    borderRadius: 9999,
    backgroundColor: "rgba(139,92,246,0.22)",
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyPlusBtn: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  emptySub: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  emptyCtaBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.2)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  emptyCtaText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#DDD6FE",
    letterSpacing: 0.2,
  },

  /* ── Skeleton ─────────────────────────────────── */
  skeletonRoot: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  skeletonHeaderTitle: {
    height: 16,
    width: 80,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  skeletonHeaderDot: {
    height: 16,
    width: 16,
    borderRadius: 8,
    backgroundColor: "rgba(139,92,246,0.25)",
  },
  skeletonItem: {
    alignItems: "center",
    gap: 6,
  },
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  skeletonLabel: {
    width: 48,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
