// src/pages/home/_components/StoryViewer.tsx

import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { LinearGradient } from "expo-linear-gradient";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api.js";

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

const STORY_DURATION = 5000;

const PROGRESS_INTERVAL = 40;

const SWIPE_THRESHOLD = 70;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const REACTION_EMOJIS = ["❤️", "😍", "🔥", "😂", "😮", "👏"] as const;

function clampIndex(value: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return Math.min(Math.max(value, 0), length - 1);
}

function getInitials(name: string): string {
  const clean = name.trim();

  if (!clean) {
    return "?";
  }

  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getDefaultGradient(): string[] {
  return ["#8B5CF6", "#6366F1"];
}

function parseGradient(value?: string): string[] {
  if (!value) {
    return getDefaultGradient();
  }

  const colors = value.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) ?? [];

  if (colors.length >= 2) {
    return colors.slice(0, 3);
  }

  return getDefaultGradient();
}

function getBackgroundColor(value?: string): string {
  if (!value) {
    return "#09091b";
  }

  const match = value.match(/#[0-9a-fA-F]{3,8}/);

  return match?.[0] ?? value;
}

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

  const [reactionAnim, setReactionAnim] = useState<string | null>(null);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const elapsedRef = useRef(0);

  const startRef = useRef(0);

  const reactionScale = useRef(new Animated.Value(0.7)).current;

  const reactionTranslateY = useRef(new Animated.Value(0)).current;

  const reactionOpacity = useRef(new Animated.Value(0)).current;

  const imageScale = useRef(new Animated.Value(1.04)).current;

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

  const backgroundColor = useMemo(() => {
    if (!slide) {
      return "#09091b";
    }

    if (slide.type === "image") {
      return "#000000";
    }

    return getBackgroundColor(slide.bg);
  }, [slide]);

  const authorGradient = useMemo(
    () => parseGradient(group?.authorGradient),
    [group?.authorGradient],
  );

  const clearTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);

      progressTimerRef.current = null;
    }
  }, []);

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
    groupIdx,
    groups.length,
    onClose,
    slideIdx,
    totalSlides,
  ]);

  const goPrevSlide = useCallback(() => {
    clearTimer();

    setProgress(0);

    elapsedRef.current = 0;

    if (!group) {
      return;
    }

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
  }, [clearTimer, group, groupIdx, groups, slideIdx]);

  useEffect(() => {
    setGroupIdx(clampIndex(initialGroupIndex, groups.length));

    setSlideIdx(0);
  }, [initialGroupIndex, groups.length]);

  useEffect(() => {
    return () => {
      clearTimer();

      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }
    };
  }, [clearTimer]);

  useEffect(() => {
    if (!slide?.id) {
      return;
    }

    void markViewed({
      storyId: slide.id as never,
    }).catch((error) => {
      console.error("[StoryViewer] markViewed failed", error);
    });

    onMarkSeen?.(group?.id ?? "");
  }, [group?.id, markViewed, onMarkSeen, slide?.id]);

  useEffect(() => {
    setProgress(0);

    elapsedRef.current = 0;

    startRef.current = Date.now();

    setPaused(false);

    setShowReactions(false);

    imageScale.setValue(1.04);

    Animated.timing(imageScale, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: true,
    }).start();
  }, [groupIdx, slideIdx, imageScale]);

  useEffect(() => {
    if (!slide || paused) {
      clearTimer();
      return;
    }

    startRef.current = Date.now() - elapsedRef.current;

    clearTimer();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;

      elapsedRef.current = elapsed;

      const percentage = Math.min((elapsed / STORY_DURATION) * 100, 100);

      setProgress(percentage);

      if (percentage >= 100) {
        clearTimer();

        goNextSlide();
      }
    }, PROGRESS_INTERVAL);

    return clearTimer;
  }, [clearTimer, goNextSlide, paused, slide]);

  const togglePause = useCallback(() => {
    setPaused((current) => !current);

    setShowReactions(false);
  }, []);

  const handleReaction = useCallback(
    (emoji: string) => {
      if (!slide) {
        return;
      }

      onReaction?.(slide.id, emoji);

      setReactionAnim(emoji);

      setShowReactions(false);

      setPaused(false);

      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }

      reactionScale.setValue(0.7);

      reactionTranslateY.setValue(0);

      reactionOpacity.setValue(1);

      Animated.parallel([
        Animated.timing(reactionScale, {
          toValue: 1.9,
          duration: 1150,
          useNativeDriver: true,
        }),

        Animated.timing(reactionTranslateY, {
          toValue: -130,
          duration: 1150,
          useNativeDriver: true,
        }),

        Animated.timing(reactionOpacity, {
          toValue: 0,
          duration: 1150,
          useNativeDriver: true,
        }),
      ]).start();

      reactionTimeoutRef.current = setTimeout(() => {
        setReactionAnim(null);
      }, 1200);
    },
    [onReaction, reactionOpacity, reactionScale, reactionTranslateY, slide],
  );

  const handlePollVote = useCallback(
    (optionIndex: number) => {
      if (!slide || slide.type !== "poll") {
        return;
      }

      if (hasPollVote) {
        return;
      }

      onPollVote?.(slide.id, optionIndex);
    },
    [hasPollVote, onPollVote, slide],
  );

  const handleStoryPress = useCallback(
    (locationX: number) => {
      if (locationX < SCREEN_WIDTH * 0.33) {
        goPrevSlide();

        return;
      }

      if (locationX > SCREEN_WIDTH * 0.66) {
        goNextSlide();

        return;
      }

      togglePause();
    },
    [goNextSlide, goPrevSlide, togglePause],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,

        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 10,

        onPanResponderGrant: () => {
          setPaused(true);
        },

        onPanResponderRelease: (_, gestureState) => {
          const { dx, dy } = gestureState;

          const isHorizontalSwipe =
            Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.2;

          if (isHorizontalSwipe) {
            if (dx < 0) {
              goNextSlide();
            } else {
              goPrevSlide();
            }

            return;
          }

          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
            handleStoryPress(gestureState.x0);
          }

          setPaused(false);
        },

        onPanResponderTerminate: () => {
          setPaused(false);
        },
      }),
    [goNextSlide, goPrevSlide, handleStoryPress],
  );

  if (!group || !slide) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.root,
          {
            backgroundColor,
          },
        ]}
      >
        <View style={styles.storyContainer} {...panResponder.panHandlers}>
          {/* IMAGE STORY */}

          {slide.type === "image" && slide.img && (
            <>
              <Animated.Image
                source={{
                  uri: slide.img,
                }}
                resizeMode="cover"
                style={[
                  styles.storyImage,
                  {
                    transform: [
                      {
                        scale: imageScale,
                      },
                    ],
                  },
                ]}
              />

              <LinearGradient
                colors={[
                  "rgba(0,0,0,0.58)",
                  "rgba(0,0,0,0.04)",
                  "rgba(0,0,0,0.05)",
                  "rgba(0,0,0,0.76)",
                ]}
                locations={[0, 0.3, 0.55, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </>
          )}

          {/* TEXT STORY */}

          {slide.type === "text" && (
            <View style={styles.textStory}>
              <Text
                style={[
                  styles.storyText,
                  {
                    color: slide.textColor ?? "#FFFFFF",
                  },
                ]}
              >
                {slide.text}
              </Text>
            </View>
          )}

          {/* POLL STORY */}

          {slide.type === "poll" && (
            <View style={styles.pollContainer}>
              <View style={styles.pollCard}>
                <View style={styles.pollIcon}>
                  <Text style={styles.pollEmoji}>📊</Text>
                </View>

                <Text style={styles.pollQuestion}>{slide.pollQuestion}</Text>

                <View style={styles.pollOptions}>
                  {(slide.pollOptions ?? []).map((option, index) => {
                    const voted = selectedPollOption === index;

                    return (
                      <Pressable
                        key={`${slide.id}-${index}`}
                        disabled={hasPollVote}
                        onPress={() => handlePollVote(index)}
                        style={[
                          styles.pollOption,
                          voted && styles.pollOptionActive,
                        ]}
                      >
                        <View style={styles.pollOptionRow}>
                          <Text style={styles.pollOptionText}>{option}</Text>

                          {voted && (
                            <View style={styles.pollCheck}>
                              <Check size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {hasPollVote && (
                  <Text style={styles.pollVoteText}>
                    Ton vote a été enregistré.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* PROGRESS */}

          <View pointerEvents="none" style={styles.progressContainer}>
            {group.slides.map((storySlide, index) => {
              const width =
                index < slideIdx
                  ? "100%"
                  : index === slideIdx
                    ? `${progress}%`
                    : "0%";

              return (
                <View key={storySlide.id} style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={authorGradient}
                style={styles.avatarBorder}
              >
                {group.authorAvatar ? (
                  <Image
                    source={{
                      uri: group.authorAvatar,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(group.authorName)}
                    </Text>
                  </View>
                )}
              </LinearGradient>

              <View style={styles.authorInfo}>
                <View style={styles.authorRow}>
                  <Text numberOfLines={1} style={styles.authorName}>
                    {group.authorName}
                  </Text>

                  {group.isLive && (
                    <View style={styles.liveBadge}>
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.timeText}>{slide.time}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => setMuted((current) => !current)}
                style={styles.iconButton}
                accessibilityLabel={muted ? "Activer le son" : "Couper le son"}
              >
                {muted ? (
                  <VolumeX size={16} color="rgba(255,255,255,0.8)" />
                ) : (
                  <Volume2 size={16} color="rgba(255,255,255,0.8)" />
                )}
              </Pressable>

              <Pressable
                onPress={onClose}
                style={styles.iconButton}
                accessibilityLabel="Fermer la story"
              >
                <X size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* PAUSE */}

          {paused && !showReactions && (
            <View pointerEvents="none" style={styles.pauseOverlay}>
              <View style={styles.pauseCircle}>
                <Pause size={26} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </View>
          )}

          {/* DESKTOP / LARGE SCREEN NAVIGATION */}

          {!isFirstSlide && (
            <Pressable
              onPress={goPrevSlide}
              style={[styles.sideNavigation, styles.sideNavigationLeft]}
              accessibilityLabel="Story précédente"
            >
              <ChevronLeft size={20} color="#FFFFFF" />
            </Pressable>
          )}

          {!isLastSlide && (
            <Pressable
              onPress={goNextSlide}
              style={[styles.sideNavigation, styles.sideNavigationRight]}
              accessibilityLabel="Story suivante"
            >
              <ChevronRight size={20} color="#FFFFFF" />
            </Pressable>
          )}

          {/* REACTION ANIMATION */}

          {reactionAnim && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.reactionAnimation,
                {
                  opacity: reactionOpacity,
                  transform: [
                    {
                      scale: reactionScale,
                    },
                    {
                      translateY: reactionTranslateY,
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.reactionAnimationText}>{reactionAnim}</Text>
            </Animated.View>
          )}

          {/* REACTION PANEL */}

          {showReactions && (
            <View style={styles.reactionPanel}>
              {REACTION_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleReaction(emoji)}
                  style={styles.reactionButton}
                  accessibilityLabel={`Réagir ${emoji}`}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* BOTTOM ACTIONS */}

          <View style={styles.bottomActions}>
            <Pressable
              onPress={() => {
                setPaused(true);

                setShowReactions((current) => !current);
              }}
              style={styles.reactButton}
            >
              <Heart
                size={15}
                color={currentReaction ? "#F472B6" : "rgba(255,255,255,0.8)"}
                fill={currentReaction ? "#F472B6" : "transparent"}
              />

              <Text style={styles.reactButtonText}>Réagir</Text>
            </Pressable>

            <View style={styles.bottomRight}>
              {currentReaction && (
                <View style={styles.currentReaction}>
                  <Text style={styles.currentReactionText}>
                    {currentReaction}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={togglePause}
                style={styles.iconButton}
                accessibilityLabel={
                  paused ? "Reprendre la story" : "Mettre la story en pause"
                }
              >
                {paused ? (
                  <Play
                    size={15}
                    color="rgba(255,255,255,0.8)"
                    fill="rgba(255,255,255,0.8)"
                  />
                ) : (
                  <Pause size={15} color="rgba(255,255,255,0.8)" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },

  storyContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000000",
    overflow: "hidden",
  },

  storyImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  textStory: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  storyText: {
    maxWidth: 340,
    textAlign: "center",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 34,
    letterSpacing: -0.5,
  },

  pollContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  pollCard: {
    width: "100%",
    maxWidth: 350,
  },

  pollIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },

  pollEmoji: {
    fontSize: 22,
  },

  pollQuestion: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
    color: "#FFFFFF",
  },

  pollOptions: {
    gap: 10,
  },

  pollOption: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  pollOptionActive: {
    backgroundColor: "rgba(139,92,246,0.72)",
    borderColor: "rgba(167,139,250,0.8)",
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
    fontWeight: "700",
    color: "#FFFFFF",
  },

  pollCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  pollVoteText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.45)",
  },

  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 14,
  },

  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 42,
  },

  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatarBorder: {
    width: 40,
    height: 40,
    padding: 2,
    borderRadius: 20,
    flexShrink: 0,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#111827",
  },

  avatarFallback: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
  },

  avatarInitials: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  authorInfo: {
    flex: 1,
    minWidth: 0,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  authorName: {
    maxWidth: 180,
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  liveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#EF4444",
  },

  liveText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: "#FFFFFF",
  },

  timeText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.55)",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  pauseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.40)",
    alignItems: "center",
    justifyContent: "center",
  },

  sideNavigation: {
    position: "absolute",
    top: "50%",
    zIndex: 40,
    width: 44,
    height: 44,
    marginTop: -22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.30)",
    alignItems: "center",
    justifyContent: "center",
  },

  sideNavigationLeft: {
    left: 12,
  },

  sideNavigationRight: {
    right: 12,
  },

  reactionAnimation: {
    position: "absolute",
    left: "50%",
    bottom: 128,
    zIndex: 50,
    marginLeft: -30,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  reactionAnimationText: {
    fontSize: 50,
  },

  reactionPanel: {
    position: "absolute",
    left: 16,
    bottom: 88,
    zIndex: 50,
    flexDirection: "row",
    gap: 4,
    padding: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  reactionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  reactionEmoji: {
    fontSize: 22,
  },

  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 34,
  },

  bottomRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  reactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  reactButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },

  currentReaction: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  currentReactionText: {
    fontSize: 20,
  },
});
