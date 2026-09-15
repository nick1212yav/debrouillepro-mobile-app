// src/pages/home/_components/StoryViewer.tsx
import {
  View,
  Text,
  Pressable,
  Image as RNImage,
  Animated,
  Easing,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  PanResponder,
  type GestureResponderEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

/* ============================================================
 * TYPES
 * ============================================================ */

export interface StorySlide {
  id: string;
  type: "text" | "image" | "poll";
  bg: string;
  img?: string;
  text?: string;
  textColor?: string;
  authorName: string;
  authorAvatar?: string;
  authorGradient?: string;
  time: string;
  pollQuestion?: string;
  pollOptions?: string[];
}

export interface StoryGroup {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorGradient?: string;
  isOwn?: boolean;
  isLive?: boolean;
  seen: boolean;
  slides: StorySlide[];
}

interface StoryViewerProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onMarkSeen?: (groupId: string) => void;
  onReaction?: (slideId: string, emoji: string) => void;
  reactions?: Record<string, string>;
  pollVotes?: Record<string, number>;
  onPollVote?: (slideId: string, optionIndex: number) => void;
}

/* ============================================================
 * CONSTANTS
 * ============================================================ */

const STORY_DURATION = 5000;
const REACTION_EMOJIS = ["❤️", "😍", "🔥", "😂", "😮", "👏"] as const;
const isBrowser = typeof window !== "undefined";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IS_DESKTOP_WEB = Platform.OS === "web" && SCREEN_WIDTH >= 768;

/* ============================================================
 * HELPERS
 * ============================================================ */

function clampIndex(value: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(value, 0), length - 1);
}

function getInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return "?";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getDefaultGradient(): string {
  return "linear-gradient(135deg,#8B5CF6,#6366F1)";
}

/**
 * Parse CSS linear-gradient string → colors array for expo LinearGradient.
 * Returns null if invalid.
 */
function parseGradient(
  input?: string,
): readonly [string, string, ...string[]] | null {
  if (!input) return null;
  const match = input.match(/linear-gradient\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1].split(",").map((s) => s.trim());
  const colors = parts.filter((p) => /^#|^rgb/i.test(p));
  if (colors.length < 2) return null;
  return [colors[0], colors[1], ...colors.slice(2)] as unknown as [
    string,
    string,
    ...string[],
  ];
}

/* ============================================================
 * BACKGROUND GRADIENT FALLBACK
 * ============================================================ */

const DEFAULT_BG_COLORS = ["#020617", "#09091B"] as const;
const DEFAULT_TEXT_BG_COLORS = ["#0A0A1A", "#1A1A3E"] as const;

/* ============================================================
 * PROGRESS BAR
 * ============================================================ */

function ProgressBars({
  slides,
  slideIdx,
  progress,
}: {
  slides: StorySlide[];
  slideIdx: number;
  progress: number;
}) {
  return (
    <View style={styles.progressRow}>
      {slides.map((s, index) => {
        const filled =
          index < slideIdx ? 100 : index === slideIdx ? progress : 0;
        return (
          <View key={s.id} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${filled}%` }]} />
          </View>
        );
      })}
    </View>
  );
}

/* ============================================================
 * REACTION FLOAT (burst)
 * ============================================================ */

function ReactionFloat({ emoji }: { emoji: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 1150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [emoji, anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.8, 0],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -130],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.9],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.reactionFloat,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <Text style={styles.reactionFloatText}>{emoji}</Text>
    </Animated.View>
  );
}

/* ============================================================
 * PULSING PLAY BUTTON (paused overlay)
 * ============================================================ */

function PausedOverlay({ visible }: { visible: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  useEffect(() => {
    if (!visible) return;
    halo.setValue(0);
    Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [visible, halo]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const haloScale = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });
  const haloOpacity = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pausedOverlay, { opacity: anim }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={styles.pausedCircle}>
          <Animated.View
            style={[
              styles.pausedHalo,
              { opacity: haloOpacity, transform: [{ scale: haloScale }] },
            ]}
          />
          <Pause size={26} color="#fff" fill="#fff" strokeWidth={0} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/* ============================================================
 * POLL OPTION
 * ============================================================ */

function PollOption({
  option,
  voted,
  disabled,
  onPress,
}: {
  option: string;
  voted: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.985,
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
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={option}
        accessibilityState={{ selected: voted }}
        style={[styles.pollOption, voted && styles.pollOptionVoted]}
      >
        {voted ? (
          <LinearGradient
            colors={["rgba(167,139,250,0.85)", "rgba(124,58,237,0.7)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={styles.pollOptionRow}>
          <Text style={styles.pollOptionText} numberOfLines={2}>
            {option}
          </Text>
          {voted ? (
            <View style={styles.pollOptionCheck}>
              <Check size={12} color="#fff" strokeWidth={3.5} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
  onMarkSeen,
  onReaction,
  reactions = {},
  pollVotes = {},
  onPollVote,
}: StoryViewerProps) {
  const [groupIdx, setGroupIdx] = useState(() =>
    clampIndex(initialGroupIndex, groups.length),
  );
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reactionEmoji, setReactionEmoji] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);

  const markViewed = useMutation(api.stories.markViewed);

  const group = groups[groupIdx];
  const slide = group?.slides[slideIdx];
  const totalSlides = group?.slides.length ?? 0;

  const currentReaction = slide ? reactions[slide.id] : undefined;
  const selectedPollOption = slide ? pollVotes[slide.id] : undefined;
  const hasPollVote = selectedPollOption !== undefined;

  const isFirstSlide = groupIdx === 0 && slideIdx === 0;
  const isLastSlide =
    groupIdx === groups.length - 1 && slideIdx === totalSlides - 1;

  /* ───── slide entry animation ───── */
  const slideAnim = useRef(new Animated.Value(0)).current;
  const imageZoom = useRef(new Animated.Value(1.04)).current;
  const reactionPanelAnim = useRef(new Animated.Value(0)).current;

  /* ───── timer ───── */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }
    };
  }, [clearTimer]);

  /* ───── markViewed ───── */
  useEffect(() => {
    if (!slide?.id) return;

    void markViewed({
      storyId: slide.id as never,
    }).catch((error) => {
      console.error("[StoryViewer] markViewed failed", error);
    });

    onMarkSeen?.(group?.id ?? "");
  }, [slide?.id, group?.id, markViewed, onMarkSeen]);

  /* ───── navigation ───── */
  const goNextSlide = useCallback(() => {
    clearTimer();
    setProgress(0);
    elapsedRef.current = 0;

    if (!group) {
      onClose();
      return;
    }

    if (slideIdx < totalSlides - 1) {
      setSlideIdx((current) => current + 1);
      return;
    }

    if (groupIdx < groups.length - 1) {
      setGroupIdx((current) => current + 1);
      setSlideIdx(0);
      return;
    }

    onClose();
  }, [
    clearTimer,
    group,
    slideIdx,
    totalSlides,
    groupIdx,
    groups.length,
    onClose,
  ]);

  const goPrevSlide = useCallback(() => {
    clearTimer();
    setProgress(0);
    elapsedRef.current = 0;

    if (!group) return;

    if (slideIdx > 0) {
      setSlideIdx((current) => current - 1);
      return;
    }

    if (groupIdx > 0) {
      const previousGroupIndex = groupIdx - 1;
      const previousGroup = groups[previousGroupIndex];
      setGroupIdx(previousGroupIndex);
      setSlideIdx(Math.max(0, (previousGroup?.slides.length ?? 1) - 1));
    }
  }, [clearTimer, group, slideIdx, groupIdx, groups]);

  /* ───── reset per slide ───── */
  useEffect(() => {
    setProgress(0);
    elapsedRef.current = 0;
    startRef.current = Date.now();
    setPaused(false);
    setShowReactions(false);
  }, [groupIdx, slideIdx]);

  /* ───── entry animation on slide change ───── */
  useEffect(() => {
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    imageZoom.setValue(1.04);
    Animated.timing(imageZoom, {
      toValue: 1,
      duration: STORY_DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [groupIdx, slideIdx, slideAnim, imageZoom]);

  /* ───── reaction panel animation ───── */
  useEffect(() => {
    Animated.spring(reactionPanelAnim, {
      toValue: showReactions ? 1 : 0,
      stiffness: 340,
      damping: 26,
      useNativeDriver: true,
    }).start();
  }, [showReactions, reactionPanelAnim]);

  /* ───── auto progress ───── */
  useEffect(() => {
    if (!slide || paused) {
      clearTimer();
      return;
    }

    startRef.current = Date.now() - elapsedRef.current;
    clearTimer();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      elapsedRef.current = elapsed;
      const percentage = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(percentage);

      if (percentage >= 100) {
        clearTimer();
        goNextSlide();
      }
    }, 40);

    return clearTimer;
  }, [slide, paused, clearTimer, goNextSlide]);

  /* ───── pause toggle ───── */
  const togglePause = useCallback(() => {
    setPaused((current) => !current);
    setShowReactions(false);
  }, []);

  /* ───── reactions ───── */
  const handleReaction = useCallback(
    (emoji: string) => {
      if (!slide) return;
      onReaction?.(slide.id, emoji);
      setReactionEmoji(emoji);
      setShowReactions(false);
      setPaused(false);

      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }
      reactionTimeoutRef.current = setTimeout(() => {
        setReactionEmoji(null);
      }, 1200);
    },
    [slide, onReaction],
  );

  /* ───── poll vote ───── */
  const handlePollVote = useCallback(
    (optionIndex: number) => {
      if (!slide || slide.type !== "poll") return;
      if (hasPollVote) return;
      onPollVote?.(slide.id, optionIndex);
    },
    [slide, hasPollVote, onPollVote],
  );

  /* ───── touch handling (tap + swipe) ───── */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => false,
        onPanResponderGrant: (evt) => {
          const { pageX, pageY } = evt.nativeEvent;
          touchStartRef.current = {
            x: pageX,
            y: pageY,
            time: Date.now(),
          };
          setPaused(true);
        },
        onPanResponderRelease: (evt, gestureState) => {
          const start = touchStartRef.current;
          if (!start) {
            setPaused(false);
            return;
          }

          const dx = gestureState.moveX - start.x;
          const dy = gestureState.moveY - start.y;
          const duration = Date.now() - start.time;

          touchStartRef.current = null;

          const isHorizontalSwipe =
            Math.abs(dx) > 70 &&
            Math.abs(dx) > Math.abs(dy) * 1.2 &&
            duration < 700;

          if (isHorizontalSwipe) {
            if (dx < 0) goNextSlide();
            else goPrevSlide();
            return;
          }

          const isTap =
            Math.abs(dx) < 12 && Math.abs(dy) < 12 && duration < 300;

          if (isTap) {
            const ratio = start.x / SCREEN_WIDTH;
            if (ratio < 0.33) goPrevSlide();
            else if (ratio > 0.66) goNextSlide();
            else togglePause();
            return;
          }

          setPaused(false);
        },
        onPanResponderTerminate: () => {
          touchStartRef.current = null;
          setPaused(false);
        },
      }),
    [goNextSlide, goPrevSlide, togglePause],
  );

  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  /* ───── keyboard shortcuts (web only) ───── */
  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          event.preventDefault();
          goNextSlide();
          break;
        case "ArrowLeft":
          event.preventDefault();
          goPrevSlide();
          break;
        case " ":
          event.preventDefault();
          togglePause();
          break;
        case "p":
        case "P":
          togglePause();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNextSlide, goPrevSlide, togglePause]);

  /* ───── render guard ───── */
  if (!group || !slide) return null;

  /* ───── derived ───── */
  const authorGradientColors =
    parseGradient(group.authorGradient ?? getDefaultGradient()) ??
    (["#8B5CF6", "#6366F1"] as const);

  const slideBgColors =
    slide.type === "image"
      ? (["#000", "#000"] as const)
      : (parseGradient(slide.bg) ?? DEFAULT_BG_COLORS);

  const slideEntryOpacity = slideAnim;
  const slideEntryScale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  const panelTranslateY = reactionPanelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const panelScale = reactionPanelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  const panelOpacity = reactionPanelAnim;

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* Full-screen dark backdrop */}
        <View style={styles.backdrop} />

        {/* Container (mobile fullscreen / desktop card) */}
        <View style={IS_DESKTOP_WEB ? styles.cardDesktop : styles.cardMobile}>
          {/* PanResponder wrapper — captures taps & swipes */}
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />

          {/* Main visual (below interactive controls) */}
          <Animated.View
            key={`${group.id}-${slide.id}`}
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: slideEntryOpacity,
                transform: [{ scale: slideEntryScale }],
              },
            ]}
          >
            {/* Background gradient */}
            <LinearGradient
              colors={slideBgColors as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Image slide */}
            {slide.type === "image" && slide.img ? (
              <>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ scale: imageZoom }] },
                  ]}
                >
                  <RNImage
                    source={{ uri: slide.img }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    accessibilityLabel={slide.text || "Story"}
                  />
                </Animated.View>
                <LinearGradient
                  colors={[
                    "rgba(0,0,0,0.5)",
                    "rgba(0,0,0,0)",
                    "rgba(0,0,0,0)",
                    "rgba(0,0,0,0.55)",
                  ]}
                  locations={[0, 0.3, 0.7, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : null}

            {/* Text slide */}
            {slide.type === "text" ? (
              <View style={styles.textSlideWrap}>
                <Text
                  style={[
                    styles.textSlideText,
                    { color: slide.textColor ?? "#fff" },
                  ]}
                >
                  {slide.text}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Poll slide — interactive, so above the tap layer */}
          {slide.type === "poll" ? (
            <View style={styles.pollWrap} pointerEvents="box-none">
              <Animated.View style={[styles.pollInner, { opacity: slideAnim }]}>
                <LinearGradient
                  colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0.06)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pollIconWrap}
                >
                  <Text style={styles.pollIconText}>📊</Text>
                </LinearGradient>

                <Text style={styles.pollQuestion}>{slide.pollQuestion}</Text>

                <View style={styles.pollOptionsList}>
                  {(slide.pollOptions ?? []).map((option, index) => (
                    <PollOption
                      key={`${slide.id}-${index}`}
                      option={option}
                      voted={selectedPollOption === index}
                      disabled={hasPollVote}
                      onPress={() => handlePollVote(index)}
                    />
                  ))}
                </View>

                {hasPollVote ? (
                  <Animated.View
                    style={[styles.pollVoteHint, { opacity: slideAnim }]}
                  >
                    <Text style={styles.pollVoteHintText}>
                      Ton vote a été enregistré.
                    </Text>
                  </Animated.View>
                ) : null}
              </Animated.View>
            </View>
          ) : null}

          {/* ═══════════ PROGRESS BARS ═══════════ */}
          <View style={styles.progressWrap} pointerEvents="none">
            <ProgressBars
              slides={group.slides}
              slideIdx={slideIdx}
              progress={progress}
            />
          </View>

          {/* ═══════════ HEADER ═══════════ */}
          <View style={styles.header} pointerEvents="box-none">
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <LinearGradient
                  colors={
                    authorGradientColors as unknown as [
                      string,
                      string,
                      ...string[],
                    ]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarRing}
                >
                  <View style={styles.avatarInner}>
                    {group.authorAvatar ? (
                      <RNImage
                        source={{ uri: group.authorAvatar }}
                        style={styles.avatarImage}
                        accessibilityLabel={group.authorName}
                      />
                    ) : (
                      <LinearGradient
                        colors={
                          authorGradientColors as unknown as [
                            string,
                            string,
                            ...string[],
                          ]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarInitialsWrap}
                      >
                        <Text style={styles.avatarInitialsText}>
                          {getInitials(group.authorName)}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>

                <View style={styles.headerInfo}>
                  <View style={styles.headerNameRow}>
                    <Text style={styles.headerName} numberOfLines={1}>
                      {group.authorName}
                    </Text>
                    {group.isLive ? (
                      <View style={styles.liveBadge}>
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.headerTime}>{slide.time}</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => setMuted((c) => !c)}
                  accessibilityLabel={
                    muted ? "Activer le son" : "Couper le son"
                  }
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.headerIconBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {muted ? (
                    <VolumeX size={16} color="rgba(255,255,255,0.85)" />
                  ) : (
                    <Volume2 size={16} color="rgba(255,255,255,0.85)" />
                  )}
                </Pressable>
                <Pressable
                  onPress={onClose}
                  accessibilityLabel="Fermer la story"
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.headerIconBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <X size={18} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* ═══════════ PAUSED OVERLAY ═══════════ */}
          <PausedOverlay visible={paused && !showReactions} />

          {/* ═══════════ DESKTOP NAV ═══════════ */}
          {IS_DESKTOP_WEB && !isFirstSlide ? (
            <Pressable
              onPress={goPrevSlide}
              accessibilityLabel="Story précédente"
              style={({ pressed }) => [
                styles.navBtnLeft,
                pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
              ]}
            >
              <ChevronLeft size={20} color="#fff" strokeWidth={2.4} />
            </Pressable>
          ) : null}

          {IS_DESKTOP_WEB && !isLastSlide ? (
            <Pressable
              onPress={goNextSlide}
              accessibilityLabel="Story suivante"
              style={({ pressed }) => [
                styles.navBtnRight,
                pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
              ]}
            >
              <ChevronRight size={20} color="#fff" strokeWidth={2.4} />
            </Pressable>
          ) : null}

          {/* ═══════════ REACTION FLOAT ═══════════ */}
          {reactionEmoji ? (
            <ReactionFloat
              key={`${reactionEmoji}-${slide.id}`}
              emoji={reactionEmoji}
            />
          ) : null}

          {/* ═══════════ REACTION PANEL ═══════════ */}
          <Animated.View
            pointerEvents={showReactions ? "auto" : "none"}
            style={[
              styles.reactionPanel,
              {
                opacity: panelOpacity,
                transform: [
                  { translateY: panelTranslateY },
                  { scale: panelScale },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["rgba(10,10,20,0.85)", "rgba(20,10,40,0.85)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.reactionPanelBorder} pointerEvents="none" />
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handleReaction(emoji)}
                accessibilityLabel={`Réagir ${emoji}`}
                style={({ pressed }) => [
                  styles.reactionBtn,
                  pressed && { transform: [{ scale: 0.85 }] },
                ]}
              >
                <Text style={styles.reactionBtnText}>{emoji}</Text>
              </Pressable>
            ))}
          </Animated.View>

          {/* ═══════════ BOTTOM ACTIONS ═══════════ */}
          <View style={styles.bottomActions} pointerEvents="box-none">
            <View style={styles.bottomRow}>
              <Pressable
                onPress={() => {
                  setPaused(true);
                  setShowReactions((c) => !c);
                }}
                accessibilityLabel="Réagir"
                style={({ pressed }) => [
                  styles.reactBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Heart
                  size={15}
                  color={currentReaction ? "#F472B6" : "rgba(255,255,255,0.85)"}
                  fill={currentReaction ? "#F472B6" : "transparent"}
                  strokeWidth={2.4}
                />
                <Text style={styles.reactBtnText}>Réagir</Text>
              </Pressable>

              {currentReaction ? (
                <View style={styles.currentReactionPill}>
                  <Text style={styles.currentReactionText}>
                    {currentReaction}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={togglePause}
                accessibilityLabel={
                  paused ? "Reprendre la story" : "Mettre la story en pause"
                }
                style={({ pressed }) => [
                  styles.playPauseBtn,
                  pressed && { opacity: 0.75 },
                ]}
              >
                {paused ? (
                  <Play
                    size={15}
                    color="rgba(255,255,255,0.9)"
                    fill="rgba(255,255,255,0.9)"
                    strokeWidth={0}
                  />
                ) : (
                  <Pause
                    size={15}
                    color="rgba(255,255,255,0.9)"
                    fill="rgba(255,255,255,0.9)"
                    strokeWidth={0}
                  />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  cardMobile: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
    overflow: "hidden",
  },
  cardDesktop: {
    width: 430,
    maxWidth: "100%",
    height: "92%",
    maxHeight: 900,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.75,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
    elevation: 24,
  },

  /* ── Progress ───────────────────────────────────── */
  progressWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    zIndex: 40,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
  },
  progressTrack: {
    height: 3,
    flex: 1,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 40,
    zIndex: 30,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerName: {
    maxWidth: 180,
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.1,
  },
  headerTime: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#EF4444",
  },
  liveBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.2,
  },

  /* ── Avatar ─────────────────────────────────────── */
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitialsWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialsText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#fff",
  },

  /* ── Text slide ─────────────────────────────────── */
  textSlideWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  textSlideText: {
    maxWidth: 340,
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
    textAlign: "center",
    letterSpacing: -1,
  },

  /* ── Poll slide ─────────────────────────────────── */
  pollWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  pollInner: {
    width: "100%",
    maxWidth: 350,
  },
  pollIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignSelf: "center",
    marginBottom: 12,
  },
  pollIconText: {
    fontSize: 20,
  },
  pollQuestion: {
    marginBottom: 20,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24,
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  pollOptionsList: {
    gap: 10,
  },
  pollOption: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  pollOptionVoted: {
    borderColor: "rgba(167,139,250,0.9)",
  },
  pollOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pollOptionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  pollOptionCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  pollVoteHint: {
    marginTop: 16,
    alignItems: "center",
  },
  pollVoteHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.2,
  },

  /* ── Paused overlay ────────────────────────────── */
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  pausedCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  pausedHalo: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(167,139,250,0.4)",
  },

  /* ── Nav buttons (desktop) ─────────────────────── */
  navBtnLeft: {
    position: "absolute",
    left: 12,
    top: "50%",
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    zIndex: 40,
  },
  navBtnRight: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    zIndex: 40,
  },

  /* ── Reaction float ────────────────────────────── */
  reactionFloat: {
    position: "absolute",
    bottom: 128,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  reactionFloatText: {
    fontSize: 48,
  },

  /* ── Reaction panel ────────────────────────────── */
  reactionPanel: {
    position: "absolute",
    bottom: 88,
    left: 16,
    flexDirection: "row",
    gap: 6,
    padding: 8,
    borderRadius: 22,
    overflow: "hidden",
    zIndex: 50,
  },
  reactionPanelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  reactionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionBtnText: {
    fontSize: 24,
  },

  /* ── Bottom actions ────────────────────────────── */
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 28,
    zIndex: 40,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  reactBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.1,
  },
  currentReactionPill: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  currentReactionText: {
    fontSize: 20,
  },
  playPauseBtn: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
});
