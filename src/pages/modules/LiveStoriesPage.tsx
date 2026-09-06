// src/pages/modules/LiveStoriesPage.tsx

import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  ArrowLeft,
  Radio,
  Play,
  Eye,
  Heart,
  Send,
  Smile,
  Mic,
  MicOff,
  Plus,
  X,
  Zap,
  Clock,
  ChevronRight,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";

import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

type Tab = "lives" | "stories" | "replays";

interface LiveStoriesPageProps {
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const FLOATING_EMOJIS = ["❤️", "🔥", "👏", "😂", "🚀", "💜", "⚡", "🎉"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(isoOrMs: string | number): string {
  const timestamp =
    typeof isoOrMs === "string" ? new Date(isoOrMs).getTime() : isoOrMs;

  const difference = Date.now() - timestamp;

  if (!Number.isFinite(difference)) {
    return "";
  }

  const minutes = Math.floor(difference / 60_000);

  if (minutes < 1) {
    return "maintenant";
  }

  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.floor(hours / 24)}j`;
}

function formatDuration(startedAt?: string): string {
  if (!startedAt) {
    return "00:00";
  }

  const start = new Date(startedAt).getTime();

  if (!Number.isFinite(start)) {
    return "00:00";
  }

  const difference = Math.max(0, Date.now() - start);
  const totalSeconds = Math.floor(difference / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(
      2,
      "0",
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getStoryBackground(mediaUrl: string): string {
  if (mediaUrl.startsWith("data:slide/")) {
    const parts = mediaUrl.replace("data:slide/", "").split("|");

    return parts[0] ?? "#667eea";
  }

  if (mediaUrl.startsWith("data:text/")) {
    const parts = mediaUrl.replace("data:text/", "").split("|");

    return parts[0] ?? "#1a1a2e";
  }

  return "#1a1a2e";
}

function getStoryText(mediaUrl: string, caption?: string): string | undefined {
  if (caption) {
    return caption;
  }

  if (mediaUrl.startsWith("data:text/")) {
    const parts = mediaUrl.replace("data:text/", "").split("|");

    return parts[1];
  }

  return undefined;
}

function isRemoteImage(url?: string): url is string {
  return Boolean(
    url && (url.startsWith("https://") || url.startsWith("http://")),
  );
}

function getInitial(name?: string): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({
  uri,
  name,
  size = 36,
  borderColor,
}: {
  uri?: string;
  name?: string;
  size?: number;
  borderColor?: string;
}) {
  if (isRemoteImage(uri)) {
    return (
      <Image
        source={{ uri }}
        className="rounded-xl"
        style={{
          width: size,
          height: size,
          borderWidth: borderColor ? 2 : 0,
          borderColor,
        }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-xl bg-purple-600"
      style={{
        width: size,
        height: size,
        borderWidth: borderColor ? 2 : 0,
        borderColor,
      }}
    >
      <Text
        className="font-black text-white"
        style={{
          fontSize: Math.max(9, size * 0.35),
        }}
      >
        {getInitial(name)}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading placeholder
// ─────────────────────────────────────────────────────────────────────────────

function Skeleton({
  height,
  className = "",
}: {
  height: number;
  className?: string;
}) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      className={`w-full rounded-3xl bg-white/10 ${className}`}
      style={{
        height,
        opacity,
      }}
    />
  );
}

function LiveSkeleton() {
  return (
    <View className="gap-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} height={200} />
      ))}
    </View>
  );
}

function StoriesSkeleton() {
  return (
    <View className="flex-row flex-wrap justify-between">
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} className="mb-3 w-[48%]">
          <Skeleton height={230} />
        </View>
      ))}
    </View>
  );
}

function ReplaysSkeleton() {
  return (
    <View className="gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} height={100} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating emoji
// ─────────────────────────────────────────────────────────────────────────────

function FloatingEmoji({ emoji, x }: { emoji: string; x: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.5,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity, scale, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute bottom-24 z-50"
      style={{
        left: `${x}%`,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <Text className="text-3xl">{emoji}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Story viewer
// ─────────────────────────────────────────────────────────────────────────────

function StoryCard({
  story,
  authorName,
  authorAvatar,
  onClose,
}: {
  story: StoryGroup["stories"][number];
  authorName: string;
  authorAvatar?: string;
  onClose: () => void;
}) {
  const backgroundColor = getStoryBackground(story.mediaUrl);

  const text = getStoryText(story.mediaUrl, story.caption);

  const hasImage = isRemoteImage(story.mediaUrl);

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black">
      <View
        className="relative w-[92%] overflow-hidden rounded-3xl"
        style={{
          aspectRatio: 9 / 16,
          maxHeight: "88%",
          backgroundColor,
        }}
      >
        {hasImage && (
          <Image
            source={{
              uri: story.mediaUrl,
            }}
            resizeMode="cover"
            className="absolute inset-0 h-full w-full"
          />
        )}

        <View className="absolute inset-x-0 top-0 bg-black/40 px-4 pb-4 pt-5">
          <View className="flex-row items-center">
            <Avatar
              uri={authorAvatar}
              name={authorName}
              size={34}
              borderColor="rgba(255,255,255,0.4)"
            />

            <View className="ml-3 flex-1">
              <Text numberOfLines={1} className="text-xs font-bold text-white">
                {authorName}
              </Text>

              <View className="mt-1 flex-row items-center">
                <Eye size={10} color="rgba(255,255,255,0.65)" />

                <Text className="ml-1 text-[10px] text-white/70">
                  {story.viewCount}
                </Text>

                <Text className="mx-1 text-[10px] text-white/60">·</Text>

                <Text className="text-[10px] text-white/60">
                  {timeAgo(story._creationTime)}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
              accessibilityRole="button"
              accessibilityLabel="Fermer la story"
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {text && (
          <View className="absolute inset-x-0 bottom-0 bg-black/50 px-5 pb-8 pt-10">
            <Text className="text-center text-lg font-bold leading-6 text-white">
              {text}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live viewer
// ─────────────────────────────────────────────────────────────────────────────

function LiveViewer({
  stream,
  onClose,
}: {
  stream: LiveStreamData;
  onClose: () => void;
}) {
  const { isAuthenticated } = useConvexAuth();

  const sendMessageMutation = useMutation(api.liveStreams.sendMessage);

  const likeStreamMutation = useMutation(api.liveStreams.likeStream);

  const streamMessages = useQuery(
    api.liveStreams.getStreamMessages,
    isAuthenticated
      ? {
          streamId: stream._id,
        }
      : "skip",
  );

  const chatScrollRef = useRef<ScrollView | null>(null);

  const [input, setInput] = useState("");
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(stream.likeCount);

  const [floating, setFloating] = useState<
    Array<{
      id: string;
      emoji: string;
      x: number;
    }>
  >([]);

  const [muted, setMuted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({
        animated: true,
      });
    });
  }, [streamMessages]);

  const addFloating = (emoji: string) => {
    const id = `reaction-${Date.now()}-${Math.random()}`;

    const x = 10 + Math.random() * 70;

    setFloating((previous) => [
      ...previous,
      {
        id,
        emoji,
        x,
      },
    ]);

    setTimeout(() => {
      setFloating((previous) => previous.filter((item) => item.id !== id));
    }, 2200);
  };

  const handleLike = async () => {
    if (liked) {
      return;
    }

    setLiked(true);
    setLikes((previous) => previous + 1);

    addFloating("❤️");

    try {
      await likeStreamMutation({
        streamId: stream._id,
      });
    } catch {
      setLiked(false);
      setLikes((previous) => Math.max(0, previous - 1));
    }
  };

  const sendMessage = async () => {
    const text = input.trim();

    if (!text) {
      return;
    }

    setInput("");

    try {
      await sendMessageMutation({
        streamId: stream._id,
        text,
        type: "chat",
      });
    } catch {
      setInput(text);
    }
  };

  return (
    <View className="absolute inset-0 z-50 bg-black">
      {isRemoteImage(stream.thumbnailUrl) && (
        <Image
          source={{
            uri: stream.thumbnailUrl,
          }}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
          style={{
            opacity: 0.4,
          }}
        />
      )}

      <View className="absolute inset-0 bg-black/40" />

      <View
        pointerEvents="none"
        className="absolute inset-0 z-40 overflow-hidden"
      >
        {floating.map((reaction) => (
          <FloatingEmoji
            key={reaction.id}
            emoji={reaction.emoji}
            x={reaction.x}
          />
        ))}
      </View>

      <View className="relative z-10 flex-1">
        {/* Header */}

        <View className="flex-row items-center px-4 pb-3 pt-14">
          <Pressable
            onPress={onClose}
            className="h-10 w-10 items-center justify-center rounded-xl bg-black/60"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View className="ml-3 flex-1 flex-row items-center">
            <Avatar
              uri={stream.hostAvatar}
              name={stream.hostName}
              size={38}
              borderColor="#EF4444"
            />

            <View className="ml-2">
              <Text numberOfLines={1} className="text-sm font-bold text-white">
                {stream.hostName}
              </Text>

              <View className="mt-1 flex-row items-center self-start rounded-full bg-red-500 px-2 py-0.5">
                <Radio size={8} color="#FFFFFF" />

                <Text className="ml-1 text-[9px] font-black text-white">
                  LIVE
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center rounded-xl bg-black/60 px-3 py-2">
            <Eye size={13} color="rgba(255,255,255,0.8)" />

            <Text className="ml-1 text-xs font-bold text-white">
              {stream.viewerCount.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Stream information */}

        <View className="px-4 pb-2">
          <Text numberOfLines={2} className="text-sm font-bold text-white">
            {stream.title}
          </Text>

          {stream.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-2"
            >
              {stream.tags.map((tag) => (
                <View
                  key={tag}
                  className="mr-2 rounded-full bg-white/15 px-2 py-1"
                >
                  <Text className="text-[10px] text-white/80">#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Chat */}

        <ScrollView
          ref={chatScrollRef}
          className="flex-1 px-4"
          contentContainerClassName="justify-end gap-2 py-3"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            chatScrollRef.current?.scrollToEnd({
              animated: true,
            });
          }}
        >
          {streamMessages?.map((message) => {
            if (message.type === "system") {
              return (
                <View key={String(message._id)} className="items-center">
                  <Text className="rounded-full bg-white/10 px-3 py-1 text-[10px] text-white/50">
                    {message.text}
                  </Text>
                </View>
              );
            }

            return (
              <View key={String(message._id)} className="flex-row items-start">
                <Avatar
                  uri={message.userAvatar}
                  name={message.userName}
                  size={28}
                />

                <View className="ml-2 max-w-[82%] rounded-2xl bg-black/60 px-3 py-2">
                  <Text className="mb-0.5 text-[10px] font-bold text-purple-300">
                    {message.userName}
                  </Text>

                  <Text className="text-xs leading-5 text-white">
                    {message.text}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Controls */}

        <View className="border-t border-white/10 bg-black/40 px-4 pb-8 pt-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            {FLOATING_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => addFloating(emoji)}
                className="mr-2 h-10 w-10 items-center justify-center rounded-xl bg-white/10"
              >
                <Text className="text-lg">{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex-row items-center">
            <Pressable
              onPress={() => void handleLike()}
              className={`h-11 w-11 items-center justify-center rounded-xl ${
                liked ? "bg-red-500/30" : "bg-white/10"
              }`}
            >
              <Heart
                size={19}
                color={liked ? "#F87171" : "rgba(255,255,255,0.7)"}
                fill={liked ? "#F87171" : "transparent"}
              />
            </Pressable>

            <View className="ml-2 flex-1 flex-row items-center rounded-2xl bg-white/10 px-3">
              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => {
                  void sendMessage();
                }}
                placeholder="Commenter..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                returnKeyType="send"
                className="flex-1 py-3 text-sm text-white"
              />

              <Smile size={17} color="rgba(255,255,255,0.4)" />
            </View>

            <Pressable
              onPress={() => void sendMessage()}
              className="ml-2 h-11 w-11 items-center justify-center rounded-xl bg-indigo-500"
            >
              <Send size={17} color="#FFFFFF" />
            </Pressable>

            <Pressable
              onPress={() => setMuted((previous) => !previous)}
              className="ml-2 h-11 w-11 items-center justify-center rounded-xl bg-white/10"
            >
              {muted ? (
                <MicOff size={17} color="#F87171" />
              ) : (
                <Mic size={17} color="rgba(255,255,255,0.7)" />
              )}
            </Pressable>
          </View>

          <Text className="mt-2 text-center text-[10px] text-white/50">
            {likes.toLocaleString()} likes · {formatDuration(stream.startedAt)}{" "}
            en direct
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LiveStoriesPage({ onBack }: LiveStoriesPageProps) {
  const { isAuthenticated } = useConvexAuth();

  const [tab, setTab] = useState<Tab>("lives");

  const [activeLive, setActiveLive] = useState<LiveStreamData | null>(null);

  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(
    null,
  );

  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

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

  const totalLive = useMemo(
    () =>
      liveStreams?.reduce((total, live) => total + live.viewerCount, 0) ?? 0,
    [liveStreams],
  );

  const tabs: Array<{
    id: Tab;
    label: string;
    icon: ComponentType<{
      size?: number;
      color?: string;
    }>;
    color: string;
  }> = [
    {
      id: "lives",
      label: "En direct",
      icon: Radio,
      color: "#EF4444",
    },
    {
      id: "stories",
      label: "Stories",
      icon: Zap,
      color: "#8B5CF6",
    },
    {
      id: "replays",
      label: "Replays",
      icon: Play,
      color: "#3B82F6",
    },
  ];

  return (
    <View className="relative h-full flex-1 overflow-hidden bg-slate-950">
      {/* Header */}

      <View className="px-5 pb-1 pt-12">
        <View className="mb-5 flex-row items-center">
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View className="ml-3 flex-1">
            <Text className="text-lg font-black text-white">
              Live & Stories
            </Text>

            <Text className="mt-0.5 text-[11px] text-white/40">
              {isAuthenticated
                ? `${totalLive.toLocaleString()} spectateurs en direct`
                : "Connectez-vous pour accéder"}
            </Text>
          </View>

          <Pressable
            className="flex-row items-center rounded-xl bg-red-500 px-3 py-2"
            accessibilityRole="button"
          >
            <Radio size={13} color="#FFFFFF" />

            <Text className="ml-1.5 text-xs font-bold text-white">
              Lancer un Live
            </Text>
          </Pressable>
        </View>

        {/* Tabs */}

        <View className="mb-3 flex-row gap-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                style={{
                  backgroundColor: active
                    ? `${item.color}22`
                    : "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: active ? `${item.color}66` : "transparent",
                }}
              >
                <Icon
                  size={14}
                  color={active ? item.color : "rgba(255,255,255,0.45)"}
                />

                <Text
                  className="ml-1.5 text-xs font-bold"
                  style={{
                    color: active ? item.color : "rgba(255,255,255,0.45)",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Not authenticated */}

      {!isAuthenticated && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-white/60">
            Connectez-vous pour voir les lives et les stories.
          </Text>
        </View>
      )}

      {/* Content */}

      {isAuthenticated && (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10 pt-3"
          showsVerticalScrollIndicator={false}
        >
          {/* LIVES */}

          {tab === "lives" && (
            <View className="gap-4">
              {isLiveLoading ? (
                <LiveSkeleton />
              ) : liveStreams && liveStreams.length > 0 ? (
                liveStreams.map((live) => (
                  <Pressable
                    key={String(live._id)}
                    onPress={() => setActiveLive(live as LiveStreamData)}
                    className="relative h-[200px] overflow-hidden rounded-3xl bg-purple-950"
                  >
                    {isRemoteImage(live.thumbnailUrl) && (
                      <Image
                        source={{
                          uri: live.thumbnailUrl,
                        }}
                        resizeMode="cover"
                        className="absolute inset-0 h-full w-full"
                      />
                    )}

                    <View className="absolute inset-0 bg-black/35" />

                    <View className="absolute left-3 top-3 flex-row items-center">
                      <View className="flex-row items-center rounded-full bg-red-500 px-3 py-1">
                        <Radio size={10} color="#FFFFFF" />

                        <Text className="ml-1 text-[10px] font-black text-white">
                          LIVE
                        </Text>
                      </View>

                      <View className="ml-2 rounded-full bg-black/60 px-2 py-1">
                        <Text className="text-[10px] text-white">
                          {formatDuration(live.startedAt)}
                        </Text>
                      </View>
                    </View>

                    <View className="absolute inset-x-3 bottom-3">
                      <View className="mb-2 flex-row items-center">
                        <Avatar
                          uri={live.hostAvatar}
                          name={live.hostName}
                          size={30}
                          borderColor="rgba(255,255,255,0.5)"
                        />

                        <Text className="ml-2 text-xs font-bold text-white">
                          {live.hostName}
                        </Text>
                      </View>

                      <Text
                        numberOfLines={2}
                        className="text-sm font-bold text-white"
                      >
                        {live.title}
                      </Text>

                      <View className="mt-2 flex-row items-center">
                        <View className="mr-4 flex-row items-center">
                          <Eye size={12} color="rgba(255,255,255,0.75)" />

                          <Text className="ml-1 text-[11px] text-white/75">
                            {live.viewerCount.toLocaleString()}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <Heart size={12} color="rgba(255,255,255,0.75)" />

                          <Text className="ml-1 text-[11px] text-white/75">
                            {live.likeCount.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View className="items-center py-12">
                  <Radio size={34} color="rgba(255,255,255,0.2)" />

                  <Text className="mt-3 text-sm text-white/40">
                    Aucun live en cours
                  </Text>

                  <Text className="mt-1 text-center text-xs text-white/25">
                    Revenez plus tard ou lancez votre propre live.
                  </Text>
                </View>
              )}

              <View className="mt-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <View className="flex-row items-center">
                  <Clock size={15} color="#A78BFA" />

                  <Text className="ml-2 text-sm font-bold text-white">
                    Prochains lives
                  </Text>
                </View>

                <Text className="py-4 text-center text-xs text-white/40">
                  Aucun live programmé pour le moment.
                </Text>
              </View>
            </View>
          )}

          {/* STORIES */}

          {tab === "stories" && (
            <View>
              <Pressable
                className="mb-4 flex-row items-center rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4"
                accessibilityRole="button"
              >
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-purple-600">
                  <Plus size={23} color="#FFFFFF" />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-white">
                    Créer une story
                  </Text>

                  <Text className="mt-1 text-[11px] text-white/50">
                    Photo, texte, sondage ou question
                  </Text>
                </View>

                <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
              </Pressable>

              {isStoriesLoading ? (
                <StoriesSkeleton />
              ) : storyGroups && storyGroups.length > 0 ? (
                <View className="flex-row flex-wrap justify-between">
                  {storyGroups.map((group) => {
                    const firstStory = group.stories[0];

                    if (!firstStory) {
                      return null;
                    }

                    const backgroundColor = getStoryBackground(
                      firstStory.mediaUrl,
                    );

                    const storyText = getStoryText(
                      firstStory.mediaUrl,
                      firstStory.caption,
                    );

                    return (
                      <Pressable
                        key={String(group.author.id)}
                        onPress={() => {
                          setActiveStoryGroup(group as StoryGroup);
                          setActiveStoryIndex(0);
                        }}
                        className="relative mb-3 w-[48%] overflow-hidden rounded-2xl"
                        style={{
                          aspectRatio: 9 / 14,
                          backgroundColor,
                        }}
                      >
                        {isRemoteImage(firstStory.mediaUrl) && (
                          <Image
                            source={{
                              uri: firstStory.mediaUrl,
                            }}
                            resizeMode="cover"
                            className="absolute inset-0 h-full w-full"
                          />
                        )}

                        <View className="absolute inset-0 bg-black/20" />

                        {group.hasUnviewed && (
                          <View className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-purple-500" />
                        )}

                        <View className="absolute inset-x-0 bottom-0 bg-black/50 p-3">
                          <View className="flex-row items-center">
                            <Avatar
                              uri={group.author.avatar}
                              name={group.author.name}
                              size={22}
                            />

                            <Text
                              numberOfLines={1}
                              className="ml-2 flex-1 text-[10px] font-bold text-white"
                            >
                              {group.author.name.split(" ")[0]}
                            </Text>
                          </View>

                          {storyText && (
                            <Text
                              numberOfLines={2}
                              className="mt-2 text-[10px] leading-4 text-white/80"
                            >
                              {storyText}
                            </Text>
                          )}

                          <View className="mt-2 flex-row items-center">
                            <Eye size={10} color="rgba(255,255,255,0.5)" />

                            <Text className="ml-1 text-[9px] text-white/60">
                              {firstStory.viewCount}
                            </Text>

                            <Text className="ml-auto text-[9px] text-white/40">
                              {timeAgo(firstStory._creationTime)}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View className="items-center py-12">
                  <Zap size={34} color="rgba(255,255,255,0.2)" />

                  <Text className="mt-3 text-sm text-white/40">
                    Aucune story active
                  </Text>

                  <Text className="mt-1 text-xs text-white/25">
                    Les stories disparaissent après 24h.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* REPLAYS */}

          {tab === "replays" && (
            <View className="gap-3">
              {isReplaysLoading ? (
                <ReplaysSkeleton />
              ) : endedStreams && endedStreams.length > 0 ? (
                endedStreams.map((replay) => (
                  <Pressable
                    key={String(replay._id)}
                    onPress={() => setActiveLive(replay as LiveStreamData)}
                    className="flex-row rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <View className="relative h-20 w-28 overflow-hidden rounded-xl bg-purple-950">
                      {isRemoteImage(replay.thumbnailUrl) && (
                        <Image
                          source={{
                            uri: replay.thumbnailUrl,
                          }}
                          resizeMode="cover"
                          className="h-full w-full"
                        />
                      )}

                      <View className="absolute inset-0 items-center justify-center bg-black/40">
                        <View className="h-9 w-9 items-center justify-center rounded-full bg-white/20">
                          <Play size={15} color="#FFFFFF" />
                        </View>
                      </View>
                    </View>

                    <View className="ml-3 flex-1 justify-center">
                      <Text
                        numberOfLines={2}
                        className="text-sm font-bold text-white"
                      >
                        {replay.title}
                      </Text>

                      <View className="mt-2 flex-row items-center">
                        <Avatar
                          uri={replay.hostAvatar}
                          name={replay.hostName}
                          size={18}
                        />

                        <Text className="ml-2 text-[10px] text-white/50">
                          {replay.hostName}
                        </Text>
                      </View>

                      <View className="mt-2 flex-row">
                        <View className="mr-4 flex-row items-center">
                          <Eye size={10} color="rgba(255,255,255,0.4)" />

                          <Text className="ml-1 text-[10px] text-white/40">
                            {replay.peakViewers.toLocaleString()}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <Heart size={10} color="rgba(255,255,255,0.4)" />

                          <Text className="ml-1 text-[10px] text-white/40">
                            {replay.likeCount.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))
              ) : (
                <View className="items-center py-12">
                  <Play size={34} color="rgba(255,255,255,0.2)" />

                  <Text className="mt-3 text-sm text-white/40">
                    Aucun replay disponible
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Live overlay */}

      {activeLive && (
        <LiveViewer stream={activeLive} onClose={() => setActiveLive(null)} />
      )}

      {/* Story overlay */}

      {activeStoryGroup && activeStoryGroup.stories[activeStoryIndex] && (
        <StoryCard
          story={activeStoryGroup.stories[activeStoryIndex]}
          authorName={activeStoryGroup.author.name}
          authorAvatar={activeStoryGroup.author.avatar}
          onClose={() => setActiveStoryGroup(null)}
        />
      )}
    </View>
  );
}
