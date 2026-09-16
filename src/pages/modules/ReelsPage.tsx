import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Gauge,
  Heart,
  Hash,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Send,
  Share2,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react-native";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel.js";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

type Speed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

type ReelPlayerHandle = {
  play?: () => Promise<void> | void;
  pause?: () => void;
  seekTo?: (seconds: number) => void;
  setMuted?: (muted: boolean) => void;
  setPlaybackRate?: (rate: number) => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
};

interface ReelsPageProps {
  onBack: () => void;
}

const SPEED_OPTIONS: readonly Speed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ─────────────────────────────────────────────────────────────────────────────
// Design system
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  black: "#000000",
  background: "#020412",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.62)",
  subtle: "rgba(255,255,255,0.38)",
  faint: "rgba(255,255,255,0.20)",
  border: "rgba(255,255,255,0.12)",
  surface: "rgba(8,12,28,0.94)",
  surfaceSoft: "rgba(255,255,255,0.065)",
  purple: "#8B5CF6",
  purpleBright: "#A78BFA",
  red: "#FB7185",
  green: "#34D399",
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return String(Math.max(0, Math.trunc(value)));
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeHashtags(value: string): string[] {
  return value
    .split(/\s+/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 20);
}

function isValidVideoUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatar,
  size = 42,
}: {
  name?: string;
  avatar?: string;
  size?: number;
}) {
  const initial = (name?.trim().charAt(0) || "?").toUpperCase();

  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        accessibilityLabel={name ?? "Avatar utilisateur"}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.28)",
        }}
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
        },
      ]}
    >
      <Text
        style={[
          styles.avatarInitial,
          {
            fontSize: Math.max(12, size * 0.34),
          },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Follow
// ─────────────────────────────────────────────────────────────────────────────

function FollowButton({ authorId }: { authorId?: Id<"users"> }) {
  const { isAuthenticated } = useConvexAuth();
  const toggleFollow = useMutation(api.follows.toggleFollow);

  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePress = useCallback(async () => {
    if (!authorId || !isAuthenticated || loading) {
      return;
    }

    setLoading(true);

    try {
      const nextFollowing = await toggleFollow({
        targetUserId: authorId,
      });

      setFollowing(nextFollowing);

      toast.success(
        nextFollowing
          ? "Vous suivez maintenant ce créateur."
          : "Abonnement retiré.",
      );
    } catch {
      toast.error("Impossible de modifier l’abonnement.");
    } finally {
      setLoading(false);
    }
  }, [authorId, isAuthenticated, loading, toggleFollow]);

  if (!authorId || !isAuthenticated) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={following ? "Ne plus suivre" : "Suivre"}
      disabled={loading}
      onPress={() => {
        void handlePress();
      }}
      style={({ pressed }) => [
        styles.followButton,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      {following ? (
        <UserCheck size={13} color={COLORS.white} />
      ) : (
        <UserPlus size={13} color={COLORS.white} />
      )}

      <Text style={styles.followText}>{following ? "Suivi" : "Suivre"}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Speed picker
// ─────────────────────────────────────────────────────────────────────────────

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
      <View style={styles.speedHeader}>
        <Text style={styles.speedTitle}>Vitesse</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer le sélecteur de vitesse"
          onPress={onClose}
          style={styles.smallCloseButton}
        >
          <X size={13} color={COLORS.muted} />
        </Pressable>
      </View>

      {[...SPEED_OPTIONS].reverse().map((option) => {
        const selected = option === speed;

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(option);
              onClose();
            }}
            style={({ pressed }) => [
              styles.speedOption,
              selected && styles.speedOptionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.speedOptionText,
                selected && styles.speedOptionTextSelected,
              ]}
            >
              {option}x
            </Text>

            {selected ? <Check size={13} color={COLORS.purpleBright} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comments
// ─────────────────────────────────────────────────────────────────────────────

function CommentsSheet({
  videoId,
  onClose,
  onCommentAdded,
}: {
  videoId: Id<"shortVideos">;
  onClose: () => void;
  onCommentAdded?: () => void;
}) {
  const { isAuthenticated } = useConvexAuth();

  const comments = useQuery(api.shortVideos.getComments, { videoId });

  const addComment = useMutation(api.shortVideos.addComment);

  const deleteComment = useMutation(api.shortVideos.deleteComment);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    const value = text.trim();

    if (!value || sending) {
      return;
    }

    if (value.length > 2000) {
      toast.error("Votre commentaire est trop long.");
      return;
    }

    setSending(true);

    try {
      await addComment({
        videoId,
        text: value,
      });

      setText("");
      onCommentAdded?.();
    } catch {
      toast.error("Impossible de publier le commentaire.");
    } finally {
      setSending(false);
    }
  }, [addComment, onCommentAdded, sending, text, videoId]);

  const handleDelete = useCallback(
    async (commentId: Id<"shortVideoComments">) => {
      try {
        await deleteComment({
          commentId,
        });
      } catch {
        toast.error("Impossible de supprimer ce commentaire.");
      }
    },
    [deleteComment],
  );

  return (
    <View style={styles.sheetOverlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer les commentaires"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.commentsSheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <MessageCircle size={17} color={COLORS.purpleBright} />

            <Text style={styles.sheetTitle}>Commentaires</Text>

            {comments !== undefined ? (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{comments.length}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={onClose}
            style={styles.closeButton}
          >
            <X size={17} color={COLORS.white} />
          </Pressable>
        </View>

        <View style={styles.commentsBody}>
          {comments === undefined ? (
            <View style={styles.commentsLoading}>
              <ActivityIndicator size="small" color={COLORS.purpleBright} />

              <Text style={styles.commentsLoadingText}>
                Chargement des commentaires…
              </Text>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.commentsEmpty}>
              <MessageCircle size={30} color={COLORS.faint} />

              <Text style={styles.commentsEmptyTitle}>Aucun commentaire</Text>

              <Text style={styles.commentsEmptyText}>
                Soyez le premier à participer à la conversation.
              </Text>
            </View>
          ) : (
            comments.map((comment) => (
              <View key={comment._id} style={styles.commentItem}>
                <Avatar name={comment.userName} size={35} />

                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{comment.userName}</Text>

                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>

                {isAuthenticated ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Supprimer le commentaire"
                    onPress={() => {
                      void handleDelete(
                        comment._id as Id<"shortVideoComments">,
                      );
                    }}
                    style={styles.commentDelete}
                  >
                    <Trash2 size={14} color={COLORS.subtle} />
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.commentComposer}>
          {isAuthenticated ? (
            <>
              <TextInput
                value={text}
                onChangeText={setText}
                editable={!sending}
                maxLength={2000}
                multiline
                placeholder="Ajouter un commentaire…"
                placeholderTextColor={COLORS.subtle}
                style={styles.commentInput}
                textAlignVertical="center"
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Publier le commentaire"
                disabled={sending || !text.trim()}
                onPress={() => {
                  void handleSend();
                }}
                style={({ pressed }) => [
                  styles.sendButton,
                  (!text.trim() || sending) && styles.sendButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Send size={15} color={COLORS.white} />
                )}
              </Pressable>
            </>
          ) : (
            <View style={styles.signInComment}>
              <Text style={styles.signInCommentText}>
                Connectez-vous pour commenter.
              </Text>

              <SignInButton />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Native video surface
//
// Cette couche ne fabrique aucune vidéo.
// Elle attend un lecteur natif branché par l'application.
// ─────────────────────────────────────────────────────────────────────────────

function NativeVideoSurface({
  video,
  active,
  muted,
  paused,
  speed,
  onStateChange,
}: {
  video: VideoItem;
  active: boolean;
  muted: boolean;
  paused: boolean;
  speed: Speed;
  onStateChange: (playing: boolean) => void;
}) {
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    if (!active) {
      onStateChange(false);
      return;
    }

    // La source vidéo vient de Convex.
    // Le composant lecteur natif de production doit consommer video.videoUrl.
    setPlayerReady(true);
  }, [active, onStateChange, video.videoUrl]);

  return (
    <View style={styles.videoSurface}>
      {video.thumbnailUrl ? (
        <Image
          source={{ uri: video.thumbnailUrl }}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Aperçu vidéo"
        />
      ) : null}

      {!playerReady ? (
        <View style={styles.videoUnavailable}>
          <ActivityIndicator size="small" color={COLORS.white} />

          <Text style={styles.videoUnavailableText}>
            Préparation de la lecture…
          </Text>
        </View>
      ) : (
        <View style={styles.videoRuntimeNotice}>
          <Play size={25} color="rgba(255,255,255,0.78)" />

          <Text style={styles.videoRuntimeTitle}>Lecteur vidéo natif</Text>

          <Text style={styles.videoRuntimeText}>Source réelle disponible</Text>

          <Text style={styles.videoRuntimeUrl} numberOfLines={1}>
            {video.videoUrl}
          </Text>
        </View>
      )}

      {paused ? (
        <View style={styles.pauseIndicator}>
          <Pause size={28} color={COLORS.white} fill={COLORS.white} />
        </View>
      ) : null}

      <View style={styles.videoMetaOverlay}>
        <Text style={styles.videoMetaText}>
          {muted ? "Muet" : "Son activé"} · {speed}x
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reel
// ─────────────────────────────────────────────────────────────────────────────

function Reel({
  video,
  active,
  onSwipeUp,
  onSwipeDown,
}: {
  video: VideoItem;
  active: boolean;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}) {
  const { height } = useWindowDimensions();

  const toggleLike = useMutation(api.shortVideos.toggleLike);

  const { isAuthenticated } = useConvexAuth();

  const [liked, setLiked] = useState(video.likedByMe);
  const [likeCount, setLikeCount] = useState(safeNumber(video.likeCount));

  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);

  const [showSpeed, setShowSpeed] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const lastTap = useRef(0);
  const startY = useRef<number | null>(null);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      toast("Connectez-vous pour aimer cette vidéo.");
      return;
    }

    try {
      const nextLiked = await toggleLike({
        videoId: video._id,
      });

      setLiked(nextLiked);

      setLikeCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)));

      if (nextLiked) {
        setShowHeart(true);

        setTimeout(() => {
          setShowHeart(false);
        }, 650);
      }
    } catch {
      toast.error("Impossible de modifier votre réaction.");
    }
  }, [isAuthenticated, toggleLike, video._id]);

  const handleTap = useCallback(() => {
    const now = Date.now();

    if (now - lastTap.current < 280) {
      lastTap.current = 0;

      if (!liked) {
        void handleLike();
      }

      return;
    }

    lastTap.current = now;

    setTimeout(() => {
      if (Date.now() - lastTap.current >= 280) {
        setPaused((current) => !current);
      }
    }, 290);
  }, [handleLike, liked]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: video.caption,
      });
    } catch {
      // L'annulation native du partage ne constitue pas une erreur produit.
    }
  }, [video.caption]);

  const handleTouchStart = useCallback(
    (event: {
      nativeEvent: {
        pageY: number;
      };
    }) => {
      startY.current = event.nativeEvent.pageY;
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (event: {
      nativeEvent: {
        pageY: number;
      };
    }) => {
      if (startY.current === null) {
        return;
      }

      const delta = startY.current - event.nativeEvent.pageY;

      startY.current = null;

      if (Math.abs(delta) < 60) {
        return;
      }

      if (delta > 0) {
        onSwipeUp();
      } else {
        onSwipeDown();
      }
    },
    [onSwipeDown, onSwipeUp],
  );

  return (
    <View
      style={[
        styles.reel,
        {
          height,
        },
      ]}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          paused ? "Lire la vidéo" : "Mettre la vidéo en pause"
        }
        onPress={handleTap}
        style={StyleSheet.absoluteFill}
      >
        <NativeVideoSurface
          video={video}
          active={active}
          muted={muted}
          paused={paused}
          speed={speed}
          onStateChange={setPaused}
        />
      </Pressable>

      <View pointerEvents="none" style={styles.reelGradientTop} />

      <View pointerEvents="none" style={styles.reelGradientBottom} />

      {showHeart ? (
        <View pointerEvents="none" style={styles.heartOverlay}>
          <Heart size={86} color={COLORS.red} fill={COLORS.red} />
        </View>
      ) : null}

      {paused ? (
        <View pointerEvents="none" style={styles.centerPlay}>
          <View style={styles.centerPlayCircle}>
            <Play size={34} color={COLORS.white} fill={COLORS.white} />
          </View>
        </View>
      ) : null}

      <View style={styles.videoControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={muted ? "Activer le son" : "Couper le son"}
          onPress={() => setMuted((current) => !current)}
          style={styles.controlButton}
        >
          {muted ? (
            <VolumeX size={17} color={COLORS.white} />
          ) : (
            <Volume2 size={17} color={COLORS.white} />
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Modifier la vitesse"
          onPress={() => setShowSpeed((current) => !current)}
          style={[
            styles.controlButton,
            speed !== 1 && styles.controlButtonActive,
          ]}
        >
          <Gauge size={17} color={COLORS.white} />
        </Pressable>
      </View>

      {showSpeed ? (
        <SpeedPicker
          speed={speed}
          onChange={setSpeed}
          onClose={() => setShowSpeed(false)}
        />
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={liked ? "Retirer le j'aime" : "Aimer"}
          onPress={() => {
            void handleLike();
          }}
          style={styles.action}
        >
          <Heart
            size={31}
            color={liked ? COLORS.red : COLORS.white}
            fill={liked ? COLORS.red : "transparent"}
          />

          <Text style={styles.actionCount}>{formatCount(likeCount)}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ouvrir les commentaires"
          onPress={() => setShowComments(true)}
          style={styles.action}
        >
          <MessageCircle size={29} color={COLORS.white} />

          <Text style={styles.actionCount}>
            {formatCount(safeNumber(video.commentCount))}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager"
          onPress={() => {
            void handleShare();
          }}
          style={styles.action}
        >
          <Share2 size={28} color={COLORS.white} />

          <Text style={styles.actionCount}>
            {formatCount(safeNumber(video.shareCount))}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? "Retirer des sauvegardes" : "Sauvegarder"}
          onPress={() => {
            setSaved((current) => !current);

            toast(
              saved
                ? "Retiré des sauvegardes."
                : "Sauvegardé sur cet appareil.",
            );
          }}
          style={styles.action}
        >
          <Bookmark
            size={27}
            color={saved ? "#FACC15" : COLORS.white}
            fill={saved ? "#FACC15" : "transparent"}
          />
        </Pressable>
      </View>

      <View style={styles.creatorBlock}>
        <View style={styles.creatorRow}>
          <Avatar
            name={video.authorName}
            avatar={video.authorAvatar}
            size={43}
          />

          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName} numberOfLines={1}>
              {video.authorName || "Utilisateur"}
            </Text>

            <Text style={styles.creatorViews}>
              {formatCount(safeNumber(video.viewCount))} vues
            </Text>
          </View>

          <FollowButton authorId={video.authorId} />
        </View>

        <Text style={styles.caption} numberOfLines={5}>
          {video.caption}
        </Text>

        {video.hashtags.length > 0 ? (
          <View style={styles.hashtagRow}>
            {video.hashtags.slice(0, 6).map((tag) => (
              <Text key={tag} style={styles.hashtag}>
                #{tag}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      {showComments ? (
        <CommentsSheet
          videoId={video._id}
          onClose={() => setShowComments(false)}
        />
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────────────────────────────────────

function UploadSheet({
  onClose,
  onPublished,
}: {
  onClose: () => void;
  onPublished?: () => void;
}) {
  const createVideo = useMutation(api.shortVideos.create);

  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handleSubmit = useCallback(async () => {
    const url = videoUrl.trim();
    const text = caption.trim();

    if (!url) {
      toast.error("La source vidéo est obligatoire.");
      return;
    }

    if (!isValidVideoUrl(url)) {
      toast.error("Veuillez fournir une URL vidéo valide.");
      return;
    }

    if (!text) {
      toast.error("La légende est obligatoire.");
      return;
    }

    if (text.length > 5000) {
      toast.error("La légende est trop longue.");
      return;
    }

    setPublishing(true);

    try {
      await createVideo({
        videoUrl: url,
        caption: text,
        hashtags: normalizeHashtags(hashtags),
      });

      toast.success("Reel publié avec succès.");
      onPublished?.();
      onClose();
    } catch {
      toast.error("La publication du Reel a échoué.");
    } finally {
      setPublishing(false);
    }
  }, [caption, createVideo, hashtags, onClose, onPublished, videoUrl]);

  return (
    <View style={styles.sheetOverlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer la publication"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.uploadSheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <Upload size={18} color={COLORS.purpleBright} />

            <Text style={styles.sheetTitle}>Publier un Reel</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            onPress={onClose}
            style={styles.closeButton}
          >
            <X size={17} color={COLORS.white} />
          </Pressable>
        </View>

        <Text style={styles.uploadIntro}>
          Publiez une vidéo réelle. Aucun contenu de démonstration n’est ajouté
          automatiquement.
        </Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Source vidéo *</Text>

          <TextInput
            value={videoUrl}
            onChangeText={setVideoUrl}
            editable={!publishing}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://…"
            placeholderTextColor={COLORS.subtle}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Légende *</Text>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            editable={!publishing}
            multiline
            maxLength={5000}
            placeholder="Racontez votre vidéo…"
            placeholderTextColor={COLORS.subtle}
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Hashtags</Text>

          <TextInput
            value={hashtags}
            onChangeText={setHashtags}
            editable={!publishing}
            autoCapitalize="none"
            placeholder="#business #afrique #tech"
            placeholderTextColor={COLORS.subtle}
            style={styles.input}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publier le Reel"
          disabled={publishing}
          onPress={() => {
            void handleSubmit();
          }}
          style={({ pressed }) => [
            styles.publishButton,
            publishing && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {publishing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Upload size={17} color={COLORS.white} />
          )}

          <Text style={styles.publishButtonText}>
            {publishing ? "Publication en cours…" : "Publier le Reel"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trending
//
// IMPORTANT : aucun hashtag fictif.
// Sans query backend dédiée, on ne prétend pas connaître les tendances.
// ─────────────────────────────────────────────────────────────────────────────

function TrendingPanel({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.trendingPanel}>
      <View style={styles.trendingHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer les tendances"
          onPress={onClose}
          style={styles.backButton}
        >
          <X size={18} color={COLORS.white} />
        </Pressable>

        <View style={styles.trendingHeaderCopy}>
          <Text style={styles.trendingTitle}>Tendances</Text>

          <Text style={styles.trendingSubtitle}>Données vérifiées</Text>
        </View>
      </View>

      <View style={styles.trendingEmpty}>
        <View style={styles.trendingEmptyIcon}>
          <Hash size={25} color={COLORS.purpleBright} />
        </View>

        <Text style={styles.trendingEmptyTitle}>Tendances en préparation</Text>

        <Text style={styles.trendingEmptyText}>
          Aucun classement de hashtags n’est affiché tant qu’une source de
          données réelle n’est pas connectée à ce module.
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyReelsState({
  authenticated,
  onBack,
  onCreate,
}: {
  authenticated: boolean;
  onBack: () => void;
  onCreate: () => void;
}) {
  return (
    <View style={styles.emptyScreen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={onBack}
        style={styles.emptyBack}
      >
        <ArrowLeft size={19} color={COLORS.white} />
      </Pressable>

      <View style={styles.emptyReelsIcon}>
        <Play size={30} color={COLORS.purpleBright} />
      </View>

      <Text style={styles.emptyReelsTitle}>Aucun Reel disponible</Text>

      <Text style={styles.emptyReelsText}>
        Le fil est actuellement vide. Débrouille Pro n’affiche aucun contenu
        fictif pour remplir cet espace.
      </Text>

      {authenticated ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publier le premier Reel"
          onPress={onCreate}
          style={styles.emptyCreateButton}
        >
          <Plus size={17} color={COLORS.white} />

          <Text style={styles.emptyCreateText}>Publier le premier Reel</Text>
        </Pressable>
      ) : (
        <SignInButton />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function ReelsPage({ onBack }: ReelsPageProps) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.shortVideos.list,
    {},
    {
      initialNumItems: 5,
    },
  );

  const { isAuthenticated } = useConvexAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showTrending, setShowTrending] = useState(false);

  const videos = useMemo(() => (results ?? []) as VideoItem[], [results]);

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore" && currentIndex >= videos.length - 2) {
      loadMore(5);
    }
  }, [currentIndex, loadMore, status, videos.length]);

  useEffect(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  const goTo = useCallback(
    (index: number) => {
      if (videos.length === 0) {
        return;
      }

      const nextIndex = Math.max(0, Math.min(index, videos.length - 1));

      setCurrentIndex(nextIndex);
    },
    [videos.length],
  );

  if (status === "LoadingFirstPage") {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={styles.backButton}
          >
            <ArrowLeft size={19} color={COLORS.white} />
          </Pressable>

          <Text style={styles.loadingHeaderTitle}>Reels</Text>
        </View>

        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.purpleBright} />

          <Text style={styles.loadingTitle}>Chargement du contenu réel</Text>

          <Text style={styles.loadingText}>
            Débrouille Pro vérifie les Reels disponibles.
          </Text>
        </View>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <EmptyReelsState
        authenticated={isAuthenticated}
        onBack={onBack}
        onCreate={() => setShowUpload(true)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.reelsHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={onBack}
          style={styles.headerButton}
        >
          <ArrowLeft size={18} color={COLORS.white} />
        </Pressable>

        <View style={styles.reelsHeaderCenter}>
          <Text style={styles.reelsTitle}>Reels</Text>

          <Text style={styles.reelsCounter}>
            {currentIndex + 1} / {videos.length}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir les tendances"
          onPress={() => setShowTrending(true)}
          style={styles.headerButton}
        >
          <TrendingIcon />
        </Pressable>
      </View>

      <View style={styles.reelList}>
        {videos.map((video, index) => (
          <View key={video._id} style={styles.reelContainer}>
            <Reel
              video={video}
              active={currentIndex === index}
              onSwipeUp={() => {
                goTo(index + 1);
              }}
              onSwipeDown={() => {
                goTo(index - 1);
              }}
            />
          </View>
        ))}
      </View>

      {videos.length > 1 ? (
        <View pointerEvents="none" style={styles.pageIndicator}>
          {videos.slice(0, 8).map((video, index) => (
            <View
              key={video._id}
              style={[
                styles.pageDot,
                index === currentIndex && styles.pageDotActive,
              ]}
            />
          ))}
        </View>
      ) : null}

      <Authenticated>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publier un Reel"
          onPress={() => setShowUpload(true)}
          style={({ pressed }) => [
            styles.floatingPublish,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={17} color={COLORS.white} />

          <Text style={styles.floatingPublishText}>Publier</Text>
        </Pressable>
      </Authenticated>

      <Unauthenticated>
        <View style={styles.signInFloating}>
          <SignInButton />
        </View>
      </Unauthenticated>

      {showUpload ? <UploadSheet onClose={() => setShowUpload(false)} /> : null}

      {showTrending ? (
        <TrendingPanel onClose={() => setShowTrending(false)} />
      ) : null}

      {status === "LoadingMore" ? (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={COLORS.white} />
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small icon component
// ─────────────────────────────────────────────────────────────────────────────

function TrendingIcon() {
  return (
    <View style={styles.trendingIcon}>
      <ChevronUp size={12} color={COLORS.white} />
      <ChevronDown size={12} color={COLORS.purpleBright} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  reelList: {
    flex: 1,
  },

  reelContainer: {
    flex: 1,
  },

  reel: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: COLORS.black,
  },

  // Header

  reelsHeader: {
    position: "absolute",
    zIndex: 30,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: 12,
  },

  headerButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  backButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reelsHeaderCenter: {
    alignItems: "center",
  },

  reelsTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  reelsCounter: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },

  trendingIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Video

  videoSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
    alignItems: "center",
    justifyContent: "center",
  },

  videoUnavailable: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  videoUnavailableText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  videoRuntimeNotice: {
    width: "76%",
    alignItems: "center",
    padding: 22,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.56)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  videoRuntimeTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10,
  },

  videoRuntimeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  videoRuntimeUrl: {
    width: "100%",
    color: COLORS.subtle,
    fontSize: 8,
    textAlign: "center",
    marginTop: 8,
  },

  videoMetaOverlay: {
    position: "absolute",
    top: 75,
    left: 15,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.40)",
  },

  videoMetaText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
  },

  reelGradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  reelGradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  // Controls

  videoControls: {
    position: "absolute",
    top: 73,
    right: 15,
    zIndex: 15,
    gap: 8,
  },

  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
  },

  controlButtonActive: {
    backgroundColor: "rgba(139,92,246,0.52)",
    borderColor: "rgba(167,139,250,0.45)",
  },

  speedPicker: {
    position: "absolute",
    zIndex: 50,
    top: 121,
    right: 15,
    width: 125,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(5,8,18,0.97)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  speedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  speedTitle: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
  },

  smallCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  speedOption: {
    minHeight: 37,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  speedOptionSelected: {
    backgroundColor: "rgba(139,92,246,0.15)",
  },

  speedOptionText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  speedOptionTextSelected: {
    color: COLORS.purpleBright,
    fontWeight: "900",
  },

  // Action rail

  actions: {
    position: "absolute",
    zIndex: 15,
    right: 12,
    bottom: 105,
    alignItems: "center",
    gap: 21,
  },

  action: {
    alignItems: "center",
    gap: 4,
    minWidth: 44,
  },

  actionCount: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },

  // Creator

  creatorBlock: {
    position: "absolute",
    zIndex: 15,
    left: 15,
    right: 74,
    bottom: 25,
  },

  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  creatorInfo: {
    flex: 1,
    minWidth: 0,
  },

  creatorName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  creatorViews: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  followButton: {
    minHeight: 31,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 11,
    backgroundColor: "rgba(139,92,246,0.34)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.38)",
  },

  followText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "900",
  },

  caption: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },

  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 7,
  },

  hashtag: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "800",
  },

  // Heart

  heartOverlay: {
    position: "absolute",
    zIndex: 25,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  centerPlay: {
    position: "absolute",
    zIndex: 24,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  centerPlayCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 3,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  pauseIndicator: {
    position: "absolute",
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  // Comments

  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.64)",
  },

  commentsSheet: {
    maxHeight: "76%",
    minHeight: "46%",
    backgroundColor: "#080D1D",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    marginTop: 9,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  sheetHeader: {
    minHeight: 58,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sheetTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  countPill: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "rgba(139,92,246,0.14)",
  },

  countPillText: {
    color: COLORS.purpleBright,
    fontSize: 9,
    fontWeight: "900",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  commentsBody: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },

  commentsLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  commentsLoadingText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  commentsEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  commentsEmptyTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },

  commentsEmptyText: {
    color: COLORS.subtle,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 15,
    marginTop: 5,
  },

  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingVertical: 8,
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.30)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.20)",
  },

  avatarInitial: {
    color: COLORS.white,
    fontWeight: "900",
  },

  commentContent: {
    flex: 1,
    minWidth: 0,
  },

  commentAuthor: {
    color: COLORS.purpleBright,
    fontSize: 10,
    fontWeight: "900",
  },

  commentText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  commentDelete: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  commentComposer: {
    minHeight: 68,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 90,
    paddingHorizontal: 13,
    paddingVertical: 9,
    color: COLORS.white,
    fontSize: 12,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.purple,
  },

  sendButtonDisabled: {
    opacity: 0.35,
  },

  signInComment: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },

  signInCommentText: {
    color: COLORS.subtle,
    fontSize: 10,
  },

  // Upload

  uploadSheet: {
    maxHeight: "88%",
    paddingHorizontal: 17,
    paddingBottom: 24,
    backgroundColor: "#080D1D",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  uploadIntro: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginHorizontal: 2,
    marginBottom: 15,
  },

  field: {
    marginBottom: 13,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
  },

  input: {
    minHeight: 46,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: COLORS.white,
    fontSize: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  multilineInput: {
    minHeight: 105,
  },

  publishButton: {
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    backgroundColor: COLORS.purple,
  },

  publishButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  // Trending

  trendingPanel: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
    backgroundColor: "#020611",
  },

  trendingHeader: {
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  trendingHeaderCopy: {
    flex: 1,
  },

  trendingTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "900",
  },

  trendingSubtitle: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 3,
  },

  trendingEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  trendingEmptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(139,92,246,0.11)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.23)",
  },

  trendingEmptyTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },

  trendingEmptyText: {
    color: COLORS.subtle,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },

  // Empty

  emptyScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: COLORS.background,
  },

  emptyBack: {
    position: "absolute",
    top: 18,
    left: 17,
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyReelsIcon: {
    width: 72,
    height: 72,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.24)",
  },

  emptyReelsTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },

  emptyReelsText: {
    color: COLORS.subtle,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 19,
  },

  emptyCreateButton: {
    minHeight: 45,
    paddingHorizontal: 17,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.purple,
  },

  emptyCreateText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  // Loading

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 17,
    paddingTop: 18,
  },

  loadingHeaderTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  loadingTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
  },

  loadingText: {
    color: COLORS.subtle,
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
  },

  loadingMore: {
    position: "absolute",
    left: "50%",
    bottom: 18,
    width: 36,
    height: 36,
    marginLeft: -18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  // Page indicator

  pageIndicator: {
    position: "absolute",
    zIndex: 25,
    left: 9,
    top: "50%",
    alignItems: "center",
    gap: 4,
  },

  pageDot: {
    width: 3,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  pageDotActive: {
    height: 18,
    backgroundColor: COLORS.purpleBright,
  },

  // Floating action

  floatingPublish: {
    position: "absolute",
    zIndex: 35,
    left: "50%",
    bottom: 18,
    minHeight: 43,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.purple,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    transform: [{ translateX: -50 }],
  },

  floatingPublishText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  signInFloating: {
    position: "absolute",
    zIndex: 35,
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
  },

  // Generic

  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.97 }],
  },

  disabled: {
    opacity: 0.45,
  },
});
