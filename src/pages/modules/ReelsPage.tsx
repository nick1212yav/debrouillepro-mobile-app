// src/pages/modules/ReelsPage.tsx

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ArrowLeft,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Gauge,
  Hash,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";

import { VideoView, useVideoPlayer } from "expo-video";

import * as Clipboard from "expo-clipboard";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";

import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
} from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api.js";

import type { Id } from "@/convex/_generated/dataModel.js";

import { SignInButton } from "@/components/ui/signin.tsx";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────────────

type VideoItem = {
  _id: Id<"shortVideos">;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  hashtags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  authorId?: Id<"users">;
  authorName?: string;
  authorAvatar?: string;
  likedByMe: boolean;
};

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

type Speed = (typeof SPEED_OPTIONS)[number];

// ─── Demo videos ─────────────────────────────────────────────────────────────

const DEMO_VIDEOS: VideoItem[] = [
  {
    _id: "demo1" as Id<"shortVideos">,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    caption:
      "Bienvenue sur le fil Reels ! Partagez vos moments en vidéos courtes 🎬",
    hashtags: ["bienvenue", "debrouillePro", "afriqueDigitale"],
    likeCount: 142,
    commentCount: 28,
    shareCount: 15,
    viewCount: 1204,
    authorName: "Débrouille Pro",
    authorAvatar: undefined,
    likedByMe: false,
  },
  {
    _id: "demo2" as Id<"shortVideos">,
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    caption: "Astuces business pour entrepreneurs africains 💼🚀",
    hashtags: ["business", "entrepreneur", "afrique"],
    likeCount: 89,
    commentCount: 14,
    shareCount: 7,
    viewCount: 620,
    authorName: "Coach Africa",
    authorAvatar: undefined,
    likedByMe: false,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCount(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
}

function getAvatarColor(name?: string): string {
  const character = (name ?? "?").charCodeAt(0);

  return `hsl(${(character * 37) % 360}, 55%, 35%)`;
}

function isDemoVideo(videoId: Id<"shortVideos">): boolean {
  return String(videoId).startsWith("demo");
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatar,
  size = 40,
}: {
  name?: string;
  avatar?: string;
  size?: number;
}) {
  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
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
          borderRadius: size / 2,
          backgroundColor: getAvatarColor(name),
        },
      ]}
    >
      <Text
        style={{
          color: "#ffffff",
          fontWeight: "800",
          fontSize: size * 0.35,
        }}
      >
        {(name ?? "?").slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Follow button ───────────────────────────────────────────────────────────

function FollowButton({ authorId }: { authorId?: Id<"users"> }) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleFollow = useMutation(api.follows.toggleFollow);

  const { isAuthenticated } = useConvexAuth();

  if (!authorId || !isAuthenticated) {
    return null;
  }

  const handleFollow = async () => {
    setLoading(true);

    try {
      const nextFollowing = await toggleFollow({
        targetUserId: authorId,
      });

      setFollowing(nextFollowing);
    } catch {
      // L'action est optionnelle : on évite de casser l'UI.
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      disabled={loading}
      onPress={() => void handleFollow()}
      style={[
        styles.followButton,
        following ? styles.followButtonActive : styles.followButtonDefault,
      ]}
    >
      {following ? (
        <UserCheck size={12} color="#ffffff" />
      ) : (
        <UserPlus size={12} color="#ffffff" />
      )}

      <Text style={styles.followButtonText}>
        {following ? "Suivi" : "Suivre"}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Speed picker ────────────────────────────────────────────────────────────

function SpeedPicker({
  speed,
  onChange,
  onClose,
}: {
  speed: Speed;
  onChange: (speed: Speed) => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.speedPicker}>
      {[...SPEED_OPTIONS].reverse().map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.speedOption,
            option === speed && styles.speedOptionActive,
          ]}
          onPress={() => {
            onChange(option);
            onClose();
          }}
        >
          <Text
            style={[
              styles.speedOptionText,
              option === speed && styles.speedOptionTextActive,
            ]}
          >
            {option}x
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Video progress ──────────────────────────────────────────────────────────

function VideoProgress({ progress }: { progress: number }) {
  const safeProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${safeProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

// ─── Comments Sheet ──────────────────────────────────────────────────────────

function CommentsSheet({
  videoId,
  onClose,
}: {
  videoId: Id<"shortVideos">;
  onClose: () => void;
}) {
  const [text, setText] = useState("");

  const { isAuthenticated } = useConvexAuth();

  const comments = useQuery(api.shortVideos.getComments, {
    videoId,
  });

  const addComment = useMutation(api.shortVideos.addComment);

  const deleteComment = useMutation(api.shortVideos.deleteComment);

  const handleSend = async () => {
    const value = text.trim();

    if (!value) {
      return;
    }

    try {
      await addComment({
        videoId,
        text: value,
      });

      setText("");
    } catch {
      // Échec silencieux pour préserver la stabilité de la sheet.
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.commentsSheet} onPress={() => undefined}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <MessageCircle size={17} color="#818cf8" />

              <Text style={styles.sheetTitle}>
                Commentaires
                {comments !== undefined ? ` (${comments.length})` : ""}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={17} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments ?? []}
            keyExtractor={(item) => String(item._id)}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              comments === undefined ? (
                <View style={styles.commentsEmpty}>
                  <ActivityIndicator color="#818cf8" />
                </View>
              ) : (
                <View style={styles.commentsEmpty}>
                  <MessageCircle size={34} color="rgba(255,255,255,0.2)" />

                  <Text style={styles.commentsEmptyText}>
                    Soyez le premier à commenter
                  </Text>
                </View>
              )
            }
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <View
                  style={[
                    styles.commentAvatar,
                    {
                      backgroundColor: `hsl(${
                        ((item.userName?.charCodeAt(0) ?? 0) * 13) % 360
                      },55%,40%)`,
                    },
                  ]}
                >
                  <Text style={styles.commentAvatarText}>
                    {item.userName?.slice(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.commentBody}>
                  <Text style={styles.commentAuthor}>{item.userName}</Text>

                  <Text style={styles.commentText}>{item.text}</Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    void deleteComment({
                      commentId: item._id as Id<"shortVideoComments">,
                    }).catch(() => undefined)
                  }
                  style={styles.commentDelete}
                >
                  <Trash2 size={14} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.commentInputRow}>
            {isAuthenticated ? (
              <>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Ajouter un commentaire..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={styles.commentInput}
                  returnKeyType="send"
                  onSubmitEditing={() => void handleSend()}
                />

                <TouchableOpacity
                  onPress={() => void handleSend()}
                  style={styles.sendButton}
                >
                  <Send size={16} color="#ffffff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.signInContainer}>
                <SignInButton />
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Demo comments sheet ─────────────────────────────────────────────────────

function DemoCommentsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.demoCommentsSheet} onPress={() => undefined}>
          <MessageCircle size={36} color="#818cf8" />

          <Text style={styles.demoCommentsTitle}>
            Commentaires disponibles sur vos vidéos
          </Text>

          <Text style={styles.demoCommentsDescription}>
            Publiez une vidéo pour activer les commentaires en temps réel.
          </Text>

          <TouchableOpacity style={styles.demoCommentsButton} onPress={onClose}>
            <Text style={styles.demoCommentsButtonText}>Fermer</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Single Reel ─────────────────────────────────────────────────────────────

function Reel({
  video,
  active,
  onSwipeUp,
  onSwipeDown,
}: {
  video: VideoItem;
  active: boolean;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}) {
  const [liked, setLiked] = useState(video.likedByMe);

  const [likeCount, setLikeCount] = useState(video.likeCount);

  const [muted, setMuted] = useState(true);

  const [paused, setPaused] = useState(false);

  const [saved, setSaved] = useState(false);

  const [showHeart, setShowHeart] = useState(false);

  const [showComments, setShowComments] = useState(false);

  const [speed, setSpeed] = useState<Speed>(1);

  const [showSpeed, setShowSpeed] = useState(false);

  const [progress, setProgress] = useState(0);

  const heartScale = useRef(new Animated.Value(0)).current;

  const heartOpacity = useRef(new Animated.Value(0)).current;

  const toggleLike = useMutation(api.shortVideos.toggleLike);

  const { isAuthenticated } = useConvexAuth();

  const player = useVideoPlayer(video.videoUrl, (instance) => {
    instance.loop = true;
    instance.muted = muted;
    instance.playbackRate = speed;

    instance.timeUpdateEventInterval = 0.25;
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    player.playbackRate = speed;
  }, [speed, player]);

  useEffect(() => {
    if (active && !paused) {
      player.play();
      return;
    }

    player.pause();

    if (!active) {
      try {
        player.currentTime = 0;
      } catch {
        // Aucun problème si la vidéo n'est pas encore prête.
      }

      setProgress(0);
    }
  }, [active, paused, player]);

  useEffect(() => {
    const subscription = player.addListener("timeUpdate", (event) => {
      const duration = player.duration;

      if (duration && duration > 0) {
        setProgress(event.currentTime / duration);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  const triggerHeartAnimation = useCallback(() => {
    setShowHeart(true);

    heartScale.setValue(0);
    heartOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(heartScale, {
        toValue: 3,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(heartOpacity, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHeart(false);
    });
  }, [heartOpacity, heartScale]);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    if (isDemoVideo(video._id)) {
      const next = !liked;

      setLiked(next);

      setLikeCount((value) => value + (next ? 1 : -1));

      if (next) {
        triggerHeartAnimation();
      }

      return;
    }

    try {
      const next = await toggleLike({
        videoId: video._id,
      });

      setLiked(next);

      setLikeCount((value) => value + (next ? 1 : -1));

      if (next) {
        triggerHeartAnimation();
      }
    } catch {
      // L'erreur ne doit pas interrompre la lecture.
    }
  }, [isAuthenticated, liked, toggleLike, triggerHeartAnimation, video._id]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${video.caption}\n\n#${video.hashtags.join(" #")}`,
      });
    } catch {
      await Clipboard.setStringAsync(video.caption);
    }
  }, [video.caption, video.hashtags]);

  const handleTap = () => {
    if (paused) {
      player.play();
      setPaused(false);
      return;
    }

    player.pause();
    setPaused(true);
  };

  const handleSave = () => {
    setSaved((value) => !value);
  };

  return (
    <View style={styles.reel}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
      />

      {/* Zone centrale de lecture */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleTap} />

      {/* Gradient */}
      <View pointerEvents="none" style={styles.reelGradient} />

      {/* Heart animation */}
      {showHeart && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.heartBurst,
            {
              opacity: heartOpacity,
              transform: [
                {
                  scale: heartScale,
                },
              ],
            },
          ]}
        >
          <Heart size={82} color="#f87171" fill="#f87171" />
        </Animated.View>
      )}

      {/* Pause indicator */}
      {paused && (
        <View pointerEvents="none" style={styles.pauseIndicator}>
          <View style={styles.pauseIndicatorCircle}>
            <Play size={34} color="#ffffff" fill="#ffffff" />
          </View>
        </View>
      )}

      {/* Top controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          onPress={() => setMuted((value) => !value)}
          style={styles.roundControl}
        >
          {muted ? (
            <VolumeX size={17} color="#ffffff" />
          ) : (
            <Volume2 size={17} color="#ffffff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowSpeed((value) => !value)}
          style={[
            styles.roundControl,
            speed !== 1 && styles.roundControlActive,
          ]}
        >
          <Gauge size={17} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {showSpeed && (
        <SpeedPicker
          speed={speed}
          onChange={setSpeed}
          onClose={() => setShowSpeed(false)}
        />
      )}

      {/* Right actions */}
      <View style={styles.actionColumn}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => void handleLike()}
        >
          <Heart
            size={31}
            color={liked ? "#f87171" : "#ffffff"}
            fill={liked ? "#f87171" : "transparent"}
          />

          <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowComments(true)}
        >
          <MessageCircle size={29} color="#ffffff" />

          <Text style={styles.actionCount}>
            {formatCount(video.commentCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => void handleShare()}
        >
          <Share2 size={27} color="#ffffff" />

          <Text style={styles.actionCount}>
            {formatCount(video.shareCount)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Bookmark
            size={27}
            color={saved ? "#facc15" : "#ffffff"}
            fill={saved ? "#facc15" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom information */}
      <View style={styles.reelInfo}>
        <View style={styles.authorRow}>
          <Avatar
            name={video.authorName}
            avatar={video.authorAvatar}
            size={42}
          />

          <View style={styles.authorDetails}>
            <Text numberOfLines={1} style={styles.authorName}>
              {video.authorName ?? "Utilisateur"}
            </Text>

            <Text style={styles.viewCount}>
              {video.viewCount.toLocaleString()} vues
            </Text>
          </View>

          <FollowButton authorId={video.authorId} />
        </View>

        <Text numberOfLines={2} style={styles.caption}>
          {video.caption}
        </Text>

        {video.hashtags.length > 0 && (
          <View style={styles.hashtagsRow}>
            {video.hashtags.slice(0, 4).map((tag) => (
              <Text key={tag} style={styles.hashtag}>
                #{tag}
              </Text>
            ))}
          </View>
        )}
      </View>

      <VideoProgress progress={progress} />

      {/* Comments */}
      {showComments && !isDemoVideo(video._id) && (
        <CommentsSheet
          videoId={video._id}
          onClose={() => setShowComments(false)}
        />
      )}

      {showComments && isDemoVideo(video._id) && (
        <DemoCommentsSheet onClose={() => setShowComments(false)} />
      )}
    </View>
  );
}

// ─── Upload Sheet ────────────────────────────────────────────────────────────

function UploadSheet({ onClose }: { onClose: () => void }) {
  const [caption, setCaption] = useState("");

  const [hashtags, setHashtags] = useState("");

  const [videoUrl, setVideoUrl] = useState("");

  const [loading, setLoading] = useState(false);

  const createVideo = useMutation(api.shortVideos.create);

  const handleSubmit = async () => {
    if (!videoUrl.trim() || !caption.trim()) {
      return;
    }

    setLoading(true);

    try {
      const tags = hashtags
        .split(" ")
        .map((tag) => tag.replace("#", "").trim())
        .filter(Boolean);

      await createVideo({
        videoUrl: videoUrl.trim(),
        caption: caption.trim(),
        hashtags: tags,
      });

      onClose();
    } catch {
      // Erreur silencieuse : la page reste utilisable.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.uploadSheet} onPress={() => undefined}>
          <View style={styles.uploadHeader}>
            <View style={styles.uploadTitleRow}>
              <Upload size={20} color="#818cf8" />

              <Text style={styles.uploadTitle}>Publier une vidéo</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={17} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>URL de la vidéo *</Text>

          <TextInput
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="https://... (MP4)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            keyboardType="url"
            style={styles.uploadInput}
          />

          <Text style={styles.inputLabel}>Légende *</Text>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Décrivez votre vidéo..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.uploadInput, styles.captionInput]}
          />

          <Text style={styles.inputLabel}>Hashtags</Text>

          <TextInput
            value={hashtags}
            onChangeText={setHashtags}
            placeholder="#afrique #business #tech"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.uploadInput}
          />

          <TouchableOpacity
            disabled={loading}
            onPress={() => void handleSubmit()}
            style={[
              styles.publishButton,
              loading && styles.publishButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Plus size={17} color="#ffffff" />

                <Text style={styles.publishButtonText}>Publier</Text>
              </>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Trending Panel ──────────────────────────────────────────────────────────

function TrendingPanel({ onClose }: { onClose: () => void }) {
  const tags = [
    "debrouillePro",
    "afriqueDigitale",
    "entrepreneur",
    "business",
    "afrique",
    "tech",
    "sante",
    "emploi",
    "agriculture",
    "communaute",
  ];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.trendingContainer}>
        <View style={styles.trendingHeader}>
          <TouchableOpacity style={styles.trendingClose} onPress={onClose}>
            <X size={20} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.trendingTitle}>Hashtags tendance</Text>
        </View>

        <FlatList
          data={tags}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.trendingList}
          renderItem={({ item }) => (
            <View style={styles.trendingItem}>
              <View style={styles.trendingItemLeft}>
                <View style={styles.trendingIcon}>
                  <Hash size={16} color="#818cf8" />
                </View>

                <Text style={styles.trendingTag}>#{item}</Text>
              </View>

              <TrendingUp size={17} color="rgba(255,255,255,0.3)" />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ReelsPage({ onBack }: { onBack: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showUpload, setShowUpload] = useState(false);

  const [showTrending, setShowTrending] = useState(false);

  const listRef = useRef<FlatList<VideoItem>>(null);

  const { results, status, loadMore } = usePaginatedQuery(
    api.shortVideos.list,
    {},
    {
      initialNumItems: 5,
    },
  );

  const videos: VideoItem[] =
    results.length > 0
      ? (results as VideoItem[])
      : status !== "LoadingFirstPage"
        ? DEMO_VIDEOS
        : [];

  const handleMomentumEnd = useCallback(
    (event: any) => {
      const offsetY = event.nativeEvent.contentOffset.y;

      const nextIndex = Math.round(offsetY / SCREEN_HEIGHT);

      setCurrentIndex(nextIndex);

      if (nextIndex >= videos.length - 2 && status === "CanLoadMore") {
        loadMore(5);
      }
    },
    [videos.length, status, loadMore],
  );

  const scrollToVideo = useCallback(
    (index: number) => {
      if (index < 0 || index >= videos.length) {
        return;
      }

      listRef.current?.scrollToIndex({
        index,
        animated: true,
      });
    },
    [videos.length],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<VideoItem> | null | undefined, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    [],
  );

  if (status === "LoadingFirstPage") {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#8b5cf6" />

        <Text style={styles.loadingText}>Chargement des Reels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={videos}
        keyExtractor={(item) => String(item._id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index }) => (
          <View
            style={{
              height: SCREEN_HEIGHT,
            }}
          >
            <Reel
              video={item}
              active={currentIndex === index}
              onSwipeUp={() =>
                scrollToVideo(Math.min(index + 1, videos.length - 1))
              }
              onSwipeDown={() => scrollToVideo(Math.max(index - 1, 0))}
            />
          </View>
        )}
      />

      {/* Header */}
      <View pointerEvents="box-none" style={styles.pageHeader}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Reels</Text>

          {videos.length > 0 && (
            <Text style={styles.headerCounter}>
              {currentIndex + 1} / {videos.length}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowTrending(true)}
          style={styles.headerButton}
        >
          <TrendingUp size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Navigation indicator */}
      {videos.length > 1 && (
        <View pointerEvents="none" style={styles.navigationIndicator}>
          {currentIndex > 0 && (
            <ChevronUp size={19} color="rgba(255,255,255,0.7)" />
          )}

          <View style={styles.navigationDots}>
            {videos.slice(0, 8).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.navigationDot,
                  index === currentIndex && styles.navigationDotActive,
                ]}
              />
            ))}
          </View>

          {currentIndex < videos.length - 1 && (
            <ChevronDown size={19} color="rgba(255,255,255,0.7)" />
          )}
        </View>
      )}

      {/* Publish */}
      <Authenticated>
        <TouchableOpacity
          style={styles.publishFab}
          onPress={() => setShowUpload(true)}
        >
          <Plus size={18} color="#ffffff" />

          <Text style={styles.publishFabText}>Publier un Reel</Text>
        </TouchableOpacity>
      </Authenticated>

      <Unauthenticated>
        <View style={styles.signInFab}>
          <SignInButton />
        </View>
      </Unauthenticated>

      {showUpload && <UploadSheet onClose={() => setShowUpload(false)} />}

      {showTrending && <TrendingPanel onClose={() => setShowTrending(false)} />}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "#000000",
  },

  loadingText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
  },

  reel: {
    flex: 1,
    backgroundColor: "#000000",
    overflow: "hidden",
  },

  reelGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  avatar: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 999,
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },

  followButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  followButtonDefault: {
    backgroundColor: "#6366f1",
  },

  followButtonActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  followButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  topControls: {
    position: "absolute",
    top: 55,
    right: 16,
    gap: 10,
    zIndex: 20,
  },

  roundControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  roundControlActive: {
    backgroundColor: "rgba(139,92,246,0.75)",
  },

  speedPicker: {
    position: "absolute",
    right: 14,
    top: 150,
    minWidth: 80,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    zIndex: 40,
  },

  speedOption: {
    paddingVertical: 11,
    alignItems: "center",
  },

  speedOptionActive: {
    backgroundColor: "rgba(139,92,246,0.2)",
  },

  speedOptionText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },

  speedOptionTextActive: {
    color: "#a78bfa",
  },

  actionColumn: {
    position: "absolute",
    right: 13,
    bottom: 90,
    alignItems: "center",
    gap: 18,
    zIndex: 15,
  },

  actionButton: {
    alignItems: "center",
    gap: 4,
  },

  actionCount: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },

  reelInfo: {
    position: "absolute",
    left: 16,
    right: 75,
    bottom: 20,
    zIndex: 10,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  authorDetails: {
    flex: 1,
    minWidth: 0,
  },

  authorName: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },

  viewCount: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },

  caption: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 7,
  },

  hashtagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  hashtag: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "800",
  },

  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    zIndex: 30,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#8b5cf6",
  },

  heartBurst: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
  },

  pauseIndicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },

  pauseIndicatorCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  commentsSheet: {
    maxHeight: "75%",
    minHeight: "50%",
    backgroundColor: "#0f1729",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sheetTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  commentsList: {
    padding: 16,
    gap: 15,
  },

  commentsEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 55,
  },

  commentsEmptyText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
  },

  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  commentAvatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },

  commentBody: {
    flex: 1,
  },

  commentAuthor: {
    color: "#a5b4fc",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },

  commentText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 19,
  },

  commentDelete: {
    padding: 4,
  },

  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },

  commentInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    color: "#ffffff",
    fontSize: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
  },

  signInContainer: {
    flex: 1,
    alignItems: "center",
  },

  demoCommentsSheet: {
    alignItems: "center",
    padding: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0f1729",
    gap: 12,
  },

  demoCommentsTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  demoCommentsDescription: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  demoCommentsButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#6366f1",
  },

  demoCommentsButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },

  uploadSheet: {
    padding: 22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0f1729",
  },

  uploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  uploadTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  uploadTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },

  inputLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginBottom: 7,
    marginTop: 12,
  },

  uploadInput: {
    minHeight: 48,
    paddingHorizontal: 15,
    borderRadius: 13,
    color: "#ffffff",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  captionInput: {
    minHeight: 100,
    paddingTop: 13,
  },

  publishButton: {
    minHeight: 52,
    marginTop: 24,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366f1",
  },

  publishButtonDisabled: {
    opacity: 0.5,
  },

  publishButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

  trendingContainer: {
    flex: 1,
    paddingTop: 55,
    backgroundColor: "#020617",
  },

  trendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  trendingClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  trendingTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
  },

  trendingList: {
    padding: 20,
    gap: 11,
  },

  trendingItem: {
    minHeight: 62,
    paddingHorizontal: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  trendingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  trendingIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.2)",
  },

  trendingTag: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  pageHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  headerTitleContainer: {
    alignItems: "center",
  },

  headerTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
  },

  headerCounter: {
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },

  navigationIndicator: {
    position: "absolute",
    left: 10,
    top: "45%",
    alignItems: "center",
    gap: 8,
    zIndex: 30,
  },

  navigationDots: {
    alignItems: "center",
    gap: 5,
  },

  navigationDot: {
    width: 4,
    height: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  navigationDotActive: {
    height: 19,
    backgroundColor: "rgba(139,92,246,0.95)",
  },

  publishFab: {
    position: "absolute",
    bottom: 25,
    alignSelf: "center",
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#6366f1",
  },

  publishFabText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

  signInFab: {
    position: "absolute",
    bottom: 25,
    alignSelf: "center",
    zIndex: 50,
  },
});
