import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Eye,
  Heart,
  MessageCircle,
  Play,
  Plus,
  Radio,
  Send,
  Share2,
  Smile,
  X,
  Zap,
} from "lucide-react-native";

import { useMutation, useQuery } from "convex/react";

import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Tab = "lives" | "stories" | "replays";

type LiveStreamData = {
  _id: Id<"liveStreams">;
  _creationTime: number;
  hostId: Id<"users">;
  title: string;
  description?: string;
  category: string;
  thumbnailUrl?: string;
  viewerCount: number;
  peakViewers: number;
  likeCount: number;
  status: "scheduled" | "live" | "ended";
  startedAt?: string;
  endedAt?: string;
  tags: string[];
  isPublic: boolean;
  hostName: string;
  hostAvatar?: string;
};

type StoryGroup = {
  author: {
    id: Id<"users">;
    name: string;
    avatar?: string;
    city?: string;
  };
  stories: Array<{
    _id: Id<"stories">;
    _creationTime: number;
    authorId: Id<"users">;
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
  }>;
  hasUnviewed: boolean;
};

type LiveMessage = {
  _id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  type: string;
};

type LiveStoriesPageProps = {
  onBack: () => void;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const BACKGROUND = "#050812";
const PANEL = "rgba(255,255,255,0.045)";
const PANEL_STRONG = "rgba(255,255,255,0.075)";
const BORDER = "rgba(255,255,255,0.08)";

const FLOATING_EMOJIS = ["❤️", "🔥", "👏", "😂", "🚀", "💜", "⚡", "🎉"];

const TAB_CONFIG: Array<{
  id: Tab;
  label: string;
  color: string;
}> = [
  {
    id: "lives",
    label: "En direct",
    color: "#EF4444",
  },
  {
    id: "stories",
    label: "Stories",
    color: "#8B5CF6",
  },
  {
    id: "replays",
    label: "Replays",
    color: "#3B82F6",
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function safeInitial(value?: string | null): string {
  const first = value?.trim()?.charAt(0);
  return first ? first.toUpperCase() : "?";
}

function isHttpUrl(value?: string): boolean {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function timeAgo(isoOrMs: string | number): string {
  const timestamp =
    typeof isoOrMs === "string" ? new Date(isoOrMs).getTime() : isoOrMs;

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const diff = Math.max(0, Date.now() - timestamp);

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "maintenant";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} h`;
  }

  return `${Math.floor(hours / 24)} j`;
}

function formatDuration(startedAt?: string, endedAt?: string): string {
  if (!startedAt) {
    return "00:00";
  }

  const start = new Date(startedAt).getTime();

  const end = endedAt ? new Date(endedAt).getTime() : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return "00:00";
  }

  const totalSeconds = Math.floor((end - start) / 1000);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getStoryBackground(mediaUrl: string): string {
  if (mediaUrl.startsWith("data:slide/")) {
    const encoded = mediaUrl.replace("data:slide/", "").split("|")[0];

    return encoded || "#15162A";
  }

  if (mediaUrl.startsWith("data:text/")) {
    const encoded = mediaUrl.replace("data:text/", "").split("|")[0];

    return encoded || "#15162A";
  }

  return "#111827";
}

function getStoryText(mediaUrl: string, caption?: string): string | undefined {
  if (caption?.trim()) {
    return caption.trim();
  }

  if (mediaUrl.startsWith("data:text/")) {
    return mediaUrl.replace("data:text/", "").split("|")[1]?.trim();
  }

  return undefined;
}

/* ============================================================================
 * AVATAR
 * ========================================================================== */

function Avatar({
  uri,
  name,
  size = 38,
  borderColor,
}: {
  uri?: string;
  name?: string;
  size?: number;
  borderColor?: string;
}) {
  const initial = safeInitial(name);

  if (isHttpUrl(uri)) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={name || "Avatar"}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: Math.max(10, size * 0.28),
            borderColor: borderColor ?? "rgba(255,255,255,0.15)",
            borderWidth: borderColor ? 2 : 1,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: Math.max(10, size * 0.28),
        },
      ]}
    >
      <Text
        style={[
          styles.avatarInitial,
          {
            fontSize: Math.max(10, size * 0.36),
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

/* ============================================================================
 * LIVE CARD
 * ========================================================================== */

function LiveCard({
  stream,
  onPress,
}: {
  stream: LiveStreamData;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le live ${stream.title}`}
      style={({ pressed }) => [styles.liveCard, pressed && styles.pressed]}
    >
      {isHttpUrl(stream.thumbnailUrl) ? (
        <Image
          source={{
            uri: stream.thumbnailUrl,
          }}
          accessibilityLabel={stream.title}
          style={styles.liveThumbnail}
        />
      ) : (
        <View style={[styles.liveThumbnail, styles.liveThumbnailFallback]}>
          <Radio size={36} color="rgba(255,255,255,0.18)" />
        </View>
      )}

      <View style={styles.liveOverlay} />

      <View style={styles.liveTopRow}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />

          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>

        <View style={styles.durationBadge}>
          <Clock size={10} color="#FFFFFF" />

          <Text style={styles.durationText}>
            {formatDuration(stream.startedAt)}
          </Text>
        </View>
      </View>

      <View style={styles.liveBottom}>
        <View style={styles.hostRow}>
          <Avatar
            uri={stream.hostAvatar}
            name={stream.hostName}
            size={29}
            borderColor="rgba(255,255,255,0.35)"
          />

          <Text style={styles.hostName} numberOfLines={1}>
            {stream.hostName}
          </Text>
        </View>

        <Text style={styles.liveTitle} numberOfLines={2}>
          {stream.title}
        </Text>

        <View style={styles.liveStats}>
          <View style={styles.inlineStat}>
            <Eye size={12} color="rgba(255,255,255,0.72)" />

            <Text style={styles.statText}>
              {stream.viewerCount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.inlineStat}>
            <Heart size={12} color="rgba(255,255,255,0.72)" />

            <Text style={styles.statText}>
              {stream.likeCount.toLocaleString()}
            </Text>
          </View>

          {stream.tags.slice(0, 2).map((tag) => (
            <Text key={tag} style={styles.tagText} numberOfLines={1}>
              #{tag}
            </Text>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * STORY CARD
 * ========================================================================== */

function StoryPreviewCard({
  group,
  onPress,
}: {
  group: StoryGroup;
  onPress: () => void;
}) {
  const firstStory = group.stories[0];

  if (!firstStory) {
    return null;
  }

  const text = getStoryText(firstStory.mediaUrl, firstStory.caption);

  const imageAvailable = isHttpUrl(firstStory.mediaUrl);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Voir les stories de ${group.author.name}`}
      style={({ pressed }) => [
        styles.storyCard,
        {
          backgroundColor: getStoryBackground(firstStory.mediaUrl),
        },
        pressed && styles.pressed,
      ]}
    >
      {imageAvailable ? (
        <Image
          source={{
            uri: firstStory.mediaUrl,
          }}
          accessibilityLabel=""
          style={styles.storyImage}
        />
      ) : null}

      <View style={styles.storyOverlay} />

      {group.hasUnviewed ? <View style={styles.unviewedDot} /> : null}

      <View style={styles.storyContent}>
        <View style={styles.storyAuthorRow}>
          <Avatar
            uri={group.author.avatar}
            name={group.author.name}
            size={24}
          />

          <Text style={styles.storyAuthor} numberOfLines={1}>
            {group.author.name}
          </Text>
        </View>

        {text ? (
          <Text style={styles.storyText} numberOfLines={3}>
            {text}
          </Text>
        ) : null}

        <View style={styles.storyMeta}>
          <Eye size={10} color="rgba(255,255,255,0.62)" />

          <Text style={styles.storyMetaText}>{firstStory.viewCount}</Text>

          <Text
            style={[
              styles.storyMetaText,
              {
                marginLeft: "auto",
              },
            ]}
          >
            {timeAgo(firstStory._creationTime)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * STORY VIEWER
 * ========================================================================== */

function StoryViewer({
  group,
  index,
  onClose,
  onPrevious,
  onNext,
}: {
  group: StoryGroup;
  index: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const story = group.stories[index];

  if (!story) {
    return null;
  }

  const storyText = getStoryText(story.mediaUrl, story.caption);

  const isImage = story.mediaType === "image" && isHttpUrl(story.mediaUrl);

  const canGoPrevious = index > 0;

  const canGoNext = index < group.stories.length - 1;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.storyModal}>
        <View style={styles.storyViewer}>
          {isImage ? (
            <Image
              source={{
                uri: story.mediaUrl,
              }}
              accessibilityLabel={story.caption || "Story"}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                {
                  backgroundColor: getStoryBackground(story.mediaUrl),
                },
              ]}
            />
          )}

          <View style={styles.storyViewerShade} />

          {/* Progress */}
          <View style={styles.storyProgressRow}>
            {group.stories.map((item, itemIndex) => (
              <View
                key={item._id}
                style={[
                  styles.storyProgressTrack,
                  itemIndex === index
                    ? styles.storyProgressActive
                    : itemIndex < index
                      ? styles.storyProgressSeen
                      : styles.storyProgressFuture,
                ]}
              />
            ))}
          </View>

          {/* Header */}
          <View style={styles.storyViewerHeader}>
            <Avatar
              uri={group.author.avatar}
              name={group.author.name}
              size={35}
            />

            <View style={styles.storyViewerIdentity}>
              <Text style={styles.storyViewerAuthor} numberOfLines={1}>
                {group.author.name}
              </Text>

              <View style={styles.storyViewerMeta}>
                <Eye size={10} color="rgba(255,255,255,0.65)" />

                <Text style={styles.storyViewerMetaText}>
                  {story.viewCount} · {timeAgo(story._creationTime)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer la story"
              style={styles.viewerClose}
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Navigation */}
          {canGoPrevious ? (
            <Pressable
              onPress={onPrevious}
              accessibilityRole="button"
              accessibilityLabel="Story précédente"
              style={[styles.storyNavigation, styles.storyNavigationLeft]}
            >
              <ChevronLeft size={28} color="#FFFFFF" />
            </Pressable>
          ) : null}

          {canGoNext ? (
            <Pressable
              onPress={onNext}
              accessibilityRole="button"
              accessibilityLabel="Story suivante"
              style={[styles.storyNavigation, styles.storyNavigationRight]}
            >
              <ChevronRight size={28} color="#FFFFFF" />
            </Pressable>
          ) : null}

          {/* Text */}
          <View style={styles.storyViewerBottom}>
            {storyText ? (
              <Text style={styles.storyViewerText}>{storyText}</Text>
            ) : null}

            <Text style={styles.storyViewerCounter}>
              {index + 1} / {group.stories.length}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * LIVE VIEWER
 * ========================================================================== */

function LiveViewer({
  stream,
  onClose,
}: {
  stream: LiveStreamData;
  onClose: () => void;
}) {
  const { isAuthenticated } = useConvexAuth();

  const sendMessageMut = useMutation(api.liveStreams.sendMessage);

  const likeStreamMut = useMutation(api.liveStreams.likeStream);

  const streamMessages = useQuery(
    api.liveStreams.getStreamMessages,
    isAuthenticated
      ? {
          streamId: stream._id,
        }
      : "skip",
  ) as LiveMessage[] | undefined;

  const [input, setInput] = useState("");

  const [liked, setLiked] = useState(false);

  const [likePending, setLikePending] = useState(false);

  const [sendPending, setSendPending] = useState(false);

  const [likes, setLikes] = useState(stream.likeCount);

  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({
        animated: true,
      });
    });
  }, [streamMessages]);

  const handleLike = useCallback(async () => {
    if (likePending || liked) {
      return;
    }

    setLikePending(true);

    try {
      await likeStreamMut({
        streamId: stream._id,
      });

      setLiked(true);
      setLikes((current) => current + 1);
    } catch {
      Alert.alert("Action impossible", "Le like n'a pas pu être enregistré.");
    } finally {
      setLikePending(false);
    }
  }, [likePending, liked, likeStreamMut, stream._id]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();

    if (!text || sendPending) {
      return;
    }

    setSendPending(true);

    try {
      await sendMessageMut({
        streamId: stream._id,
        text,
        type: "chat",
      });

      setInput("");
    } catch {
      Alert.alert(
        "Message non envoyé",
        "Impossible d'envoyer votre message pour le moment.",
      );
    } finally {
      setSendPending(false);
    }
  }, [input, sendPending, sendMessageMut, stream._id]);

  const shareLive = useCallback(async () => {
    try {
      await Share.share({
        title: stream.title,
        message: `${stream.title} — Live sur DébrouillePro`,
      });
    } catch {
      // Annulation du partage.
    }
  }, [stream.title]);

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.liveViewer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Media / visual layer */}
        {isHttpUrl(stream.thumbnailUrl) ? (
          <Image
            source={{
              uri: stream.thumbnailUrl,
            }}
            accessibilityLabel={stream.title}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFillObject, styles.liveViewerFallback]}
          >
            <Radio size={64} color="rgba(255,255,255,0.12)" />
          </View>
        )}

        <View style={styles.liveViewerShade} />

        {/* Header */}
        <View style={styles.liveViewerHeader}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer le live"
            style={styles.viewerIconButton}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.liveViewerHost}>
            <Avatar
              uri={stream.hostAvatar}
              name={stream.hostName}
              size={38}
              borderColor="#EF4444"
            />

            <View style={styles.liveViewerHostIdentity}>
              <Text style={styles.liveViewerHostName} numberOfLines={1}>
                {stream.hostName}
              </Text>

              <View style={styles.liveIndicator}>
                <View style={styles.liveDotSmall} />

                <Text style={styles.liveIndicatorText}>EN DIRECT</Text>
              </View>
            </View>
          </View>

          <View style={styles.viewerActions}>
            <View style={styles.viewerCount}>
              <Eye size={12} color="#FFFFFF" />

              <Text style={styles.viewerCountText}>
                {stream.viewerCount.toLocaleString()}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                void shareLive();
              }}
              accessibilityRole="button"
              accessibilityLabel="Partager le live"
              style={styles.viewerIconButton}
            >
              <Share2 size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Title */}
        <View style={styles.liveViewerTitleBlock}>
          <Text style={styles.liveViewerTitle} numberOfLines={3}>
            {stream.title}
          </Text>

          {stream.tags.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.liveTags}
            >
              {stream.tags.map((tag) => (
                <View key={tag} style={styles.liveTag}>
                  <Text style={styles.liveTagText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {/* Chat */}
        <ScrollView
          ref={chatScrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {streamMessages?.map((message) => {
            if (message.type === "system") {
              return (
                <View key={message._id} style={styles.systemMessage}>
                  <Text style={styles.systemMessageText}>{message.text}</Text>
                </View>
              );
            }

            return (
              <View key={message._id} style={styles.chatMessageRow}>
                <Avatar
                  uri={message.userAvatar}
                  name={message.userName}
                  size={25}
                />

                <View style={styles.chatBubble}>
                  <Text style={styles.chatAuthor}>{message.userName}</Text>

                  <Text style={styles.chatText}>{message.text}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom controls */}
        <View style={styles.liveBottomPanel}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiRow}
          >
            {FLOATING_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  setInput((current) => current + emoji);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ajouter ${emoji}`}
                style={({ pressed }) => [
                  styles.emojiButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.composerRow}>
            <Pressable
              onPress={() => {
                void handleLike();
              }}
              disabled={liked || likePending}
              accessibilityRole="button"
              accessibilityLabel={liked ? "Live aimé" : "Aimer le live"}
              style={[styles.likeButton, liked && styles.likeButtonActive]}
            >
              <Heart
                size={18}
                color={liked ? "#EF4444" : "rgba(255,255,255,0.7)"}
                fill={liked ? "#EF4444" : "transparent"}
              />
            </Pressable>

            <View style={styles.inputContainer}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Écrire un commentaire…"
                placeholderTextColor="rgba(255,255,255,0.38)"
                style={styles.messageInput}
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={() => {
                  void sendMessage();
                }}
              />

              <Smile size={17} color="rgba(255,255,255,0.38)" />
            </View>

            <Pressable
              onPress={() => {
                void sendMessage();
              }}
              disabled={!input.trim() || sendPending}
              accessibilityRole="button"
              accessibilityLabel="Envoyer le commentaire"
              style={[
                styles.sendButton,
                (!input.trim() || sendPending) && styles.disabledButton,
              ]}
            >
              <Send size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.liveFooterStats}>
            <View style={styles.footerStat}>
              <Heart size={11} color="#94A3B8" />

              <Text style={styles.footerStatText}>
                {likes.toLocaleString()}
              </Text>
            </View>

            <View style={styles.footerStat}>
              <Clock size={11} color="#94A3B8" />

              <Text style={styles.footerStatText}>
                {formatDuration(stream.startedAt)}
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ============================================================================
 * EMPTY STATE
 * ========================================================================== */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

/* ============================================================================
 * SKELETONS
 * ========================================================================== */

function LiveSkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1].map((item) => (
        <View key={item} style={styles.liveSkeleton}>
          <View style={styles.skeletonShimmer} />
        </View>
      ))}
    </View>
  );
}

function StoriesSkeleton() {
  return (
    <View style={styles.storySkeletonGrid}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.storySkeleton} />
      ))}
    </View>
  );
}

function ReplaysSkeleton() {
  return (
    <View style={styles.replaySkeletonList}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.replaySkeleton} />
      ))}
    </View>
  );
}

/* ============================================================================
 * REPLAY CARD
 * ========================================================================== */

function ReplayCard({ stream }: { stream: LiveStreamData }) {
  return (
    <View style={styles.replayCard}>
      <View style={styles.replayThumbnail}>
        {isHttpUrl(stream.thumbnailUrl) ? (
          <Image
            source={{
              uri: stream.thumbnailUrl,
            }}
            accessibilityLabel={stream.title}
            style={styles.replayImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.replayFallback}>
            <Play size={20} color="rgba(255,255,255,0.25)" />
          </View>
        )}

        <View style={styles.replayPlay}>
          <Play size={13} color="#FFFFFF" />
        </View>

        {stream.startedAt && stream.endedAt ? (
          <View style={styles.replayDuration}>
            <Text style={styles.replayDurationText}>
              {formatDuration(stream.startedAt, stream.endedAt)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.replayBody}>
        <Text style={styles.replayTitle} numberOfLines={2}>
          {stream.title}
        </Text>

        <View style={styles.replayHost}>
          <Avatar uri={stream.hostAvatar} name={stream.hostName} size={19} />

          <Text style={styles.replayHostName} numberOfLines={1}>
            {stream.hostName}
          </Text>
        </View>

        <View style={styles.replayStats}>
          <View style={styles.inlineStat}>
            <Eye size={10} color="#64748B" />

            <Text style={styles.replayStatText}>
              {stream.peakViewers.toLocaleString()}
            </Text>
          </View>

          <View style={styles.inlineStat}>
            <Heart size={10} color="#64748B" />

            <Text style={styles.replayStatText}>
              {stream.likeCount.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

export default function LiveStoriesPage({ onBack }: LiveStoriesPageProps) {
  const { isAuthenticated } = useConvexAuth();

  const [tab, setTab] = useState<Tab>("lives");

  const [activeLive, setActiveLive] = useState<LiveStreamData | null>(null);

  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(
    null,
  );

  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  const liveStreams = useQuery(
    api.liveStreams.listLiveStreams,
    isAuthenticated
      ? {
          status: "live",
        }
      : "skip",
  );

  const endedStreams = useQuery(
    api.liveStreams.listLiveStreams,
    isAuthenticated
      ? {
          status: "ended",
        }
      : "skip",
  );

  const storyGroups = useQuery(
    api.stories.listActiveStories,
    isAuthenticated ? {} : "skip",
  );

  const isLiveLoading = isAuthenticated && liveStreams === undefined;

  const isStoriesLoading = isAuthenticated && storyGroups === undefined;

  const isReplaysLoading = isAuthenticated && endedStreams === undefined;

  const totalLive =
    liveStreams?.reduce((total, stream) => total + stream.viewerCount, 0) ?? 0;

  const liveCount = liveStreams?.length ?? 0;

  const storiesCount = storyGroups?.length ?? 0;

  const replaysCount = endedStreams?.length ?? 0;

  const currentTabCount = useMemo(() => {
    if (tab === "lives") {
      return liveCount;
    }

    if (tab === "stories") {
      return storiesCount;
    }

    return replaysCount;
  }, [tab, liveCount, storiesCount, replaysCount]);

  const openStoryGroup = useCallback((group: StoryGroup) => {
    setActiveStoryGroup(group);
    setActiveStoryIdx(0);
  }, []);

  const closeStory = useCallback(() => {
    setActiveStoryGroup(null);
    setActiveStoryIdx(0);
  }, []);

  const handleCreateLive = useCallback(() => {
    Alert.alert(
      "Lancer un Live",
      "La création d'un live doit être reliée au flux de création et de diffusion réel du backend avant d'être activée.",
    );
  }, []);

  const handleCreateStory = useCallback(() => {
    Alert.alert(
      "Créer une story",
      "La création d'une story doit être reliée au flux média et au backend réel avant d'être activée.",
    );
  }, []);

  return (
    <View style={styles.screen}>
      {/* ================================================================
       * HEADER
       * ============================================================ */}

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <View style={styles.headerTitleRow}>
            <Radio size={17} color="#EF4444" />

            <Text style={styles.headerTitle}>Live & Stories</Text>
          </View>

          <Text style={styles.headerSubtitle}>
            {isAuthenticated
              ? `${totalLive.toLocaleString()} spectateurs en direct`
              : "Connectez-vous pour accéder aux contenus en direct"}
          </Text>
        </View>

        {isAuthenticated ? (
          <Pressable
            onPress={handleCreateLive}
            accessibilityRole="button"
            accessibilityLabel="Lancer un Live"
            style={({ pressed }) => [
              styles.createLiveButton,
              pressed && styles.pressed,
            ]}
          >
            <Radio size={13} color="#FFFFFF" />

            <Text style={styles.createLiveText}>Live</Text>
          </Pressable>
        ) : null}
      </View>

      {/* ================================================================
       * TABS
       * ============================================================ */}

      <View style={styles.tabs}>
        {TAB_CONFIG.map((item) => {
          const active = tab === item.id;

          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              accessibilityRole="tab"
              accessibilityState={{
                selected: active,
              }}
              style={({ pressed }) => [
                styles.tabButton,
                {
                  backgroundColor: active ? `${item.color}18` : PANEL,
                  borderColor: active ? `${item.color}42` : BORDER,
                },
                pressed && styles.pressed,
              ]}
            >
              {item.id === "lives" ? (
                <Radio size={14} color={active ? item.color : "#64748B"} />
              ) : item.id === "stories" ? (
                <Zap size={14} color={active ? item.color : "#64748B"} />
              ) : (
                <Play size={14} color={active ? item.color : "#64748B"} />
              )}

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: active ? "#FFFFFF" : "#64748B",
                  },
                ]}
              >
                {item.label}
              </Text>

              {active && currentTabCount > 0 ? (
                <View
                  style={[
                    styles.tabCount,
                    {
                      backgroundColor: `${item.color}24`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      {
                        color: item.color,
                      },
                    ]}
                  >
                    {currentTabCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* ================================================================
       * AUTH GATE
       * ============================================================ */}

      {!isAuthenticated ? (
        <View style={styles.authState}>
          <View style={styles.authIcon}>
            <Radio size={30} color="#EF4444" />
          </View>

          <Text style={styles.authTitle}>Contenus en direct</Text>

          <Text style={styles.authDescription}>
            Connectez-vous pour accéder aux lives, stories et replays
            disponibles dans votre espace.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* ============================================================
           * LIVES
           * ======================================================== */}

          {tab === "lives" ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>En direct maintenant</Text>

                  <Text style={styles.sectionSubtitle}>
                    Contenus réellement diffusés actuellement
                  </Text>
                </View>

                <View style={styles.sectionLiveIndicator}>
                  <View style={styles.liveDotSmall} />

                  <Text style={styles.sectionLiveText}>
                    {liveCount} live
                    {liveCount > 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {isLiveLoading ? (
                <LiveSkeleton />
              ) : liveStreams && liveStreams.length > 0 ? (
                <View style={styles.liveList}>
                  {liveStreams.map((stream) => (
                    <LiveCard
                      key={stream._id}
                      stream={stream}
                      onPress={() => setActiveLive(stream)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon={<Radio size={30} color="#475569" />}
                  title="Aucun live en cours"
                  description="Aucune diffusion en direct n'est actuellement disponible."
                />
              )}

              <View style={styles.infoPanel}>
                <Clock size={16} color="#8B5CF6" />

                <View style={styles.infoPanelBody}>
                  <Text style={styles.infoPanelTitle}>Prochains lives</Text>

                  <Text style={styles.infoPanelText}>
                    Aucun agenda de diffusion n'est affiché ici tant qu'aucune
                    donnée programmée réelle n'est fournie par le backend.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* ============================================================
           * STORIES
           * ======================================================== */}

          {tab === "stories" ? (
            <View style={styles.section}>
              <Pressable
                onPress={handleCreateStory}
                accessibilityRole="button"
                accessibilityLabel="Créer une story"
                style={({ pressed }) => [
                  styles.createStoryCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.createStoryIcon}>
                  <Plus size={22} color="#FFFFFF" />
                </View>

                <View style={styles.createStoryBody}>
                  <Text style={styles.createStoryTitle}>Créer une story</Text>

                  <Text style={styles.createStoryText}>
                    Publiez du contenu depuis le flux média réel de
                    l'application.
                  </Text>
                </View>

                <ChevronRight size={18} color="#475569" />
              </Pressable>

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Stories actives</Text>

                  <Text style={styles.sectionSubtitle}>
                    Contenu encore disponible
                  </Text>
                </View>
              </View>

              {isStoriesLoading ? (
                <StoriesSkeleton />
              ) : storyGroups && storyGroups.length > 0 ? (
                <View style={styles.storyGrid}>
                  {storyGroups.map((group) => (
                    <StoryPreviewCard
                      key={group.author.id}
                      group={group}
                      onPress={() => openStoryGroup(group)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon={<Zap size={30} color="#475569" />}
                  title="Aucune story active"
                  description="Aucune story disponible actuellement."
                />
              )}
            </View>
          ) : null}

          {/* ============================================================
           * REPLAYS
           * ======================================================== */}

          {tab === "replays" ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Replays</Text>

                  <Text style={styles.sectionSubtitle}>
                    Diffusions terminées disponibles
                  </Text>
                </View>
              </View>

              {isReplaysLoading ? (
                <ReplaysSkeleton />
              ) : endedStreams && endedStreams.length > 0 ? (
                <View style={styles.replayList}>
                  {endedStreams.map((stream) => (
                    <ReplayCard key={stream._id} stream={stream} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon={<Play size={30} color="#475569" />}
                  title="Aucun replay disponible"
                  description="Aucune diffusion terminée n'est actuellement disponible."
                />
              )}
            </View>
          ) : null}

          {/* ============================================================
           * TRUST / ARCHITECTURE
           * ======================================================== */}

          <View style={styles.transparencyCard}>
            <View style={styles.transparencyIcon}>
              <Code2 size={17} color="#8B5CF6" />
            </View>

            <View style={styles.transparencyBody}>
              <Text style={styles.transparencyTitle}>Contenu authentique</Text>

              <Text style={styles.transparencyText}>
                Les lives, stories, statistiques, messages et interactions
                affichés dans ce module proviennent des données disponibles
                auprès du backend. Aucun compteur ou contenu fictif n'est ajouté
                pour remplir l'interface.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ================================================================
       * LIVE MODAL
       * ============================================================ */}

      {activeLive ? (
        <LiveViewer stream={activeLive} onClose={() => setActiveLive(null)} />
      ) : null}

      {/* ================================================================
       * STORY MODAL
       * ============================================================ */}

      {activeStoryGroup ? (
        <StoryViewer
          group={activeStoryGroup}
          index={activeStoryIdx}
          onClose={closeStory}
          onPrevious={() =>
            setActiveStoryIdx((current) => Math.max(0, current - 1))
          }
          onNext={() =>
            setActiveStoryIdx((current) =>
              Math.min(activeStoryGroup.stories.length - 1, current + 1),
            )
          }
        />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  /* ------------------------------------------------------------------------
   * HEADER
   * ---------------------------------------------------------------------- */

  header: {
    minHeight: 76,
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(2,6,23,0.96)",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  headerIdentity: {
    flex: 1,
    minWidth: 0,
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  headerSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 9,
    fontWeight: "650",
  },

  createLiveButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  createLiveText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
  },

  /* ------------------------------------------------------------------------
   * TABS
   * ---------------------------------------------------------------------- */

  tabs: {
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 7,
    flexDirection: "row",
    gap: 7,
    backgroundColor: "rgba(2,6,23,0.96)",
  },

  tabButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  tabLabel: {
    fontSize: 9.5,
    fontWeight: "850",
  },

  tabCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  tabCountText: {
    fontSize: 8,
    fontWeight: "900",
  },

  /* ------------------------------------------------------------------------
   * MAIN
   * ---------------------------------------------------------------------- */

  mainScroll: {
    flex: 1,
  },

  contentContainer: {
    width: "100%",
    maxWidth: 780,
    alignSelf: "center",
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 36,
  },

  section: {
    width: "100%",
  },

  sectionHeader: {
    marginTop: 8,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#475569",
    fontSize: 8.5,
    fontWeight: "650",
  },

  sectionLiveIndicator: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },

  sectionLiveText: {
    color: "#F87171",
    fontSize: 8,
    fontWeight: "900",
  },

  liveList: {
    gap: 12,
  },

  /* ------------------------------------------------------------------------
   * LIVE CARD
   * ---------------------------------------------------------------------- */

  liveCard: {
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#101525",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  liveThumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },

  liveThumbnailFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },

  liveOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  liveTopRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  liveBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DC2626",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },

  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "950",
    letterSpacing: 0.7,
  },

  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  durationText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "800",
  },

  liveBottom: {
    position: "absolute",
    left: 13,
    right: 13,
    bottom: 13,
  },

  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },

  hostName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  liveTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },

  liveStats: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  inlineStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  statText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 8.5,
    fontWeight: "700",
  },

  tagText: {
    maxWidth: 80,
    color: "rgba(255,255,255,0.48)",
    fontSize: 8,
    fontWeight: "700",
  },

  /* ------------------------------------------------------------------------
   * STORIES
   * ---------------------------------------------------------------------- */

  createStoryCard: {
    marginTop: 8,
    marginBottom: 15,
    padding: 13,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(139,92,246,0.075)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.22)",
  },

  createStoryIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },

  createStoryBody: {
    flex: 1,
  },

  createStoryTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  createStoryText: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 13,
  },

  storyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  storyCard: {
    width: "48.7%",
    aspectRatio: 9 / 14,
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  storyImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },

  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.36)",
  },

  unviewedDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#A855F7",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  storyContent: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 9,
  },

  storyAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  storyAuthor: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "850",
  },

  storyText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "650",
  },

  storyMeta: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  storyMetaText: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 7.5,
    fontWeight: "650",
  },

  /* ------------------------------------------------------------------------
   * REPLAYS
   * ---------------------------------------------------------------------- */

  replayList: {
    gap: 9,
  },

  replayCard: {
    padding: 10,
    borderRadius: 18,
    flexDirection: "row",
    gap: 11,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: BORDER,
  },

  replayThumbnail: {
    width: 112,
    height: 76,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "#111827",
  },

  replayImage: {
    width: "100%",
    height: "100%",
  },

  replayFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  replayPlay: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 31,
    height: 31,
    marginLeft: -15.5,
    marginTop: -15.5,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  replayDuration: {
    position: "absolute",
    right: 5,
    bottom: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  replayDurationText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "800",
  },

  replayBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  replayTitle: {
    color: "#F8FAFC",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "850",
  },

  replayHost: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  replayHostName: {
    flex: 1,
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  replayStats: {
    marginTop: 6,
    flexDirection: "row",
    gap: 10,
  },

  replayStatText: {
    color: "#64748B",
    fontSize: 7.5,
    fontWeight: "700",
  },

  /* ------------------------------------------------------------------------
   * INFO / TRANSPARENCY
   * ---------------------------------------------------------------------- */

  infoPanel: {
    marginTop: 13,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(139,92,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.14)",
  },

  infoPanelBody: {
    flex: 1,
  },

  infoPanelTitle: {
    color: "#CBD5E1",
    fontSize: 9.5,
    fontWeight: "850",
  },

  infoPanelText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
  },

  transparencyCard: {
    marginTop: 20,
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  transparencyIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  transparencyBody: {
    flex: 1,
  },

  transparencyTitle: {
    color: "#CBD5E1",
    fontSize: 9.5,
    fontWeight: "850",
  },

  transparencyText: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
  },

  /* ------------------------------------------------------------------------
   * EMPTY / AUTH
   * ---------------------------------------------------------------------- */

  emptyState: {
    minHeight: 190,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  emptyTitle: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "850",
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 300,
    marginTop: 5,
    color: "#475569",
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
  },

  authState: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  authIcon: {
    width: 72,
    height: 72,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.18)",
  },

  authTitle: {
    marginTop: 16,
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "900",
  },

  authDescription: {
    maxWidth: 330,
    marginTop: 7,
    color: "#64748B",
    fontSize: 9.5,
    lineHeight: 15,
    textAlign: "center",
  },

  /* ------------------------------------------------------------------------
   * SKELETON
   * ---------------------------------------------------------------------- */

  skeletonList: {
    gap: 12,
  },

  liveSkeleton: {
    height: 220,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  skeletonShimmer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  storySkeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  storySkeleton: {
    width: "48.7%",
    aspectRatio: 9 / 14,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  replaySkeletonList: {
    gap: 9,
  },

  replaySkeleton: {
    height: 98,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },

  /* ------------------------------------------------------------------------
   * STORY VIEWER
   * ---------------------------------------------------------------------- */

  storyModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    alignItems: "center",
    justifyContent: "center",
  },

  storyViewer: {
    width: "100%",
    height: "100%",
    maxWidth: 500,
    overflow: "hidden",
    backgroundColor: "#0B1020",
  },

  storyViewerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  storyProgressRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 5,
    flexDirection: "row",
    gap: 4,
  },

  storyProgressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
  },

  storyProgressActive: {
    backgroundColor: "#FFFFFF",
  },

  storyProgressSeen: {
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  storyProgressFuture: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  storyViewerHeader: {
    position: "absolute",
    top: 26,
    left: 14,
    right: 14,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  storyViewerIdentity: {
    flex: 1,
    minWidth: 0,
  },

  storyViewerAuthor: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "850",
  },

  storyViewerMeta: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  storyViewerMetaText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 8,
    fontWeight: "650",
  },

  viewerClose: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  storyNavigation: {
    position: "absolute",
    top: "50%",
    marginTop: -23,
    zIndex: 10,
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.36)",
  },

  storyNavigationLeft: {
    left: 10,
  },

  storyNavigationRight: {
    right: 10,
  },

  storyViewerBottom: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 28,
    alignItems: "center",
  },

  storyViewerText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "850",
    textAlign: "center",
  },

  storyViewerCounter: {
    marginTop: 9,
    color: "rgba(255,255,255,0.52)",
    fontSize: 8,
    fontWeight: "750",
  },

  /* ------------------------------------------------------------------------
   * LIVE VIEWER
   * ---------------------------------------------------------------------- */

  liveViewer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  liveViewerFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#090D18",
  },

  liveViewerShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
  },

  liveViewerHeader: {
    paddingHorizontal: 13,
    paddingTop: 15,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  viewerIconButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  liveViewerHost: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  liveViewerHostIdentity: {
    flex: 1,
    minWidth: 0,
  },

  liveViewerHostName: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "850",
  },

  liveIndicator: {
    alignSelf: "flex-start",
    marginTop: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(220,38,38,0.75)",
  },

  liveDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },

  liveIndicatorText: {
    color: "#FFFFFF",
    fontSize: 6.5,
    fontWeight: "950",
    letterSpacing: 0.4,
  },

  viewerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  viewerCount: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  viewerCountText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "800",
  },

  liveViewerTitleBlock: {
    paddingHorizontal: 15,
    paddingTop: 5,
    paddingBottom: 7,
  },

  liveViewerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  liveTags: {
    paddingTop: 7,
    gap: 6,
  },

  liveTag: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  liveTagText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 7.5,
    fontWeight: "700",
  },

  chatScroll: {
    flex: 1,
    marginTop: 2,
  },

  chatContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
    justifyContent: "flex-end",
  },

  chatMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  chatBubble: {
    maxWidth: "82%",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  chatAuthor: {
    color: "#C084FC",
    fontSize: 7.5,
    fontWeight: "850",
    marginBottom: 2,
  },

  chatText: {
    color: "rgba(255,255,255,0.91)",
    fontSize: 9.5,
    lineHeight: 14,
  },

  systemMessage: {
    alignItems: "center",
    paddingVertical: 2,
  },

  systemMessageText: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    color: "rgba(255,255,255,0.48)",
    fontSize: 7.5,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  liveBottomPanel: {
    paddingHorizontal: 13,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  emojiRow: {
    gap: 7,
    paddingBottom: 8,
  },

  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  emojiText: {
    fontSize: 17,
  },

  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  likeButton: {
    width: 41,
    height: 41,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  likeButtonActive: {
    backgroundColor: "rgba(239,68,68,0.20)",
  },

  inputContainer: {
    flex: 1,
    minHeight: 41,
    maxHeight: 90,
    paddingHorizontal: 11,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  messageInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 82,
    paddingVertical: 8,
    paddingHorizontal: 0,
    color: "#FFFFFF",
    fontSize: 10,
  },

  sendButton: {
    width: 41,
    height: 41,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
  },

  disabledButton: {
    opacity: 0.35,
  },

  liveFooterStats: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  footerStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  footerStatText: {
    color: "#64748B",
    fontSize: 7.5,
    fontWeight: "700",
  },

  /* ------------------------------------------------------------------------
   * AVATAR
   * ---------------------------------------------------------------------- */

  avatar: {
    backgroundColor: "#111827",
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6D28D9",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  avatarInitial: {
    color: "#FFFFFF",
    fontWeight: "950",
  },

  /* ------------------------------------------------------------------------
   * GENERAL
   * ---------------------------------------------------------------------- */

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});
