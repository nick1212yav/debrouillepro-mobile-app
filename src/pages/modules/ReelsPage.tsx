// src/pages/modules/ReelsPage.tsx — VERSION FINALE

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
  Modal,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";

import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Check,
  Flag,
  Gauge,
  Heart,
  Hash,
  MessageCircle,
  Play,
  Plus,
  Send,
  Share2,
  ShieldCheck,
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

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Visibility = "public" | "followers" | "private";

type ModerationStatus = "pending" | "approved" | "rejected";

type ReportReason =
  | "spam"
  | "nudity"
  | "violence"
  | "harassment"
  | "misinformation"
  | "copyright"
  | "other";

type Speed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

type ReelsMode = "public" | "mine";

type VideoItem = {
  _id: Id<"shortVideos">;

  videoStorageId?: Id<"_storage">;
  thumbnailStorageId?: Id<"_storage">;

  videoUrlResolved?: string | null;
  thumbnailUrlResolved?: string | null;

  videoUrl?: string | null;
  thumbnailUrl?: string | null;

  duration?: number;

  caption: string;
  hashtags: string[];
  soundName?: string;

  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  saveCount: number;

  isActive: boolean;
  isDeleted: boolean;
  isPinned: boolean;

  visibility: Visibility;
  moderationStatus: ModerationStatus;

  city?: string;

  schemaVersion: number;
  createdAt: number;
  updatedAt: number;

  authorId?: Id<"users">;
  authorName?: string;
  authorAvatar?: string;

  likedByMe: boolean;
  savedByMe: boolean;
};

type CommentItem = {
  _id: Id<"shortVideoComments">;
  videoId: Id<"shortVideos">;
  userId: Id<"users">;

  text: string;

  parentCommentId?: Id<"shortVideoComments">;

  likeCount: number;
  replyCount: number;

  isDeleted: boolean;

  moderationStatus: "pending" | "approved" | "rejected";

  createdAt: number;
  updatedAt: number;

  userName: string;
  userAvatar?: string;

  likedByMe: boolean;
};

type AnalyticsData = {
  videoId: Id<"shortVideos">;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  saveCount: number;
  completedViews: number;
  countedViews: number;
  totalWatchedMs: number;
  shareEvents: number;
  saveEvents: number;
  averageWatchMs: number;
  completionRate: number;
};

type ReelsPageProps = {
  onBack: () => void;
  mode?: ReelsMode;
};

const SPEED_OPTIONS: readonly Speed[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

const TOP_INSET: number =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 28) : 44;

/* ============================================================================
 * DESIGN SYSTEM
 * ========================================================================== */

const COLORS = {
  black: "#000000",
  background: "#020412",
  surface: "#080D1D",
  surface2: "#0C1226",

  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.64)",
  subtle: "rgba(255,255,255,0.42)",
  faint: "rgba(255,255,255,0.20)",

  border: "rgba(255,255,255,0.12)",
  borderStrong: "rgba(255,255,255,0.18)",

  purple: "#8B5CF6",
  purpleBright: "#A78BFA",

  red: "#FB7185",
  green: "#34D399",
  yellow: "#FACC15",
  orange: "#FB923C",
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function formatCount(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

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
  return [
    ...new Set(
      value
        .split(/\s+/)
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean),
    ),
  ].slice(0, 30);
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function createSessionId(): string {
  return `reels-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

function resolveVideoSource(video: VideoItem): string | null {
  if (
    typeof video.videoUrlResolved === "string" &&
    video.videoUrlResolved.trim().length > 0
  ) {
    return video.videoUrlResolved;
  }

  if (typeof video.videoUrl === "string" && video.videoUrl.trim().length > 0) {
    return video.videoUrl;
  }

  return null;
}

function resolveThumbnailSource(video: VideoItem): string | null {
  if (
    typeof video.thumbnailUrlResolved === "string" &&
    video.thumbnailUrlResolved.trim().length > 0
  ) {
    return video.thumbnailUrlResolved;
  }

  if (
    typeof video.thumbnailUrl === "string" &&
    video.thumbnailUrl.trim().length > 0
  ) {
    return video.thumbnailUrl;
  }

  return null;
}

function getModerationBadge(status: ModerationStatus): {
  label: string;
  tone: "pending" | "approved" | "rejected";
} {
  if (status === "approved") {
    return { label: "🟢 Publié", tone: "approved" };
  }
  if (status === "rejected") {
    return { label: "🔴 Rejeté", tone: "rejected" };
  }
  return { label: "🟡 En attente de validation", tone: "pending" };
}

/* ============================================================================
 * AVATAR
 * ========================================================================== */

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

/* ============================================================================
 * FOLLOW
 * ========================================================================== */

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
    } catch (error) {
      toast.error(
        getErrorMessage(error) || "Impossible de modifier l’abonnement.",
      );
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

/* ============================================================================
 * SPEED PICKER
 * ========================================================================== */

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
          accessibilityLabel="Fermer"
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

/* ============================================================================
 * REPORT
 * ========================================================================== */

function ReportSheet({
  videoId,
  onClose,
}: {
  videoId: Id<"shortVideos">;
  onClose: () => void;
}) {
  const report = useMutation(api.shortVideos.report);

  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const reasons: Array<{ value: ReportReason; label: string }> = [
    { value: "spam", label: "Spam" },
    { value: "nudity", label: "Nudité" },
    { value: "violence", label: "Violence" },
    { value: "harassment", label: "Harcèlement" },
    { value: "misinformation", label: "Désinformation" },
    { value: "copyright", label: "Droits d’auteur" },
    { value: "other", label: "Autre" },
  ];

  const submit = useCallback(async () => {
    if (sending) {
      return;
    }

    setSending(true);

    try {
      await report({
        videoId,
        reason,
        details: details.trim() || undefined,
      });

      toast.success("Signalement enregistré.");

      onClose();
    } catch (error) {
      toast.error(
        getErrorMessage(error) || "Impossible d’envoyer le signalement.",
      );
    } finally {
      setSending(false);
    }
  }, [details, onClose, reason, report, sending, videoId]);

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.reportSheet}>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <Flag size={17} color={COLORS.red} />

            <Text style={styles.sheetTitle}>Signaler ce Reel</Text>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={17} color={COLORS.white} />
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Motif</Text>

        <View style={styles.reportReasons}>
          {reasons.map((item) => {
            const selected = reason === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => setReason(item.value)}
                style={[
                  styles.reportReason,
                  selected && styles.reportReasonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.reportReasonText,
                    selected && styles.reportReasonTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Détails facultatifs</Text>

        <TextInput
          value={details}
          onChangeText={setDetails}
          multiline
          maxLength={2000}
          placeholder="Ajoutez un contexte utile…"
          placeholderTextColor={COLORS.subtle}
          style={[styles.input, styles.multilineInput]}
        />

        <Pressable
          disabled={sending}
          onPress={() => {
            void submit();
          }}
          style={[styles.publishButton, sending && styles.disabled]}
        >
          {sending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Flag size={16} color={COLORS.white} />
          )}

          <Text style={styles.publishButtonText}>
            {sending ? "Envoi…" : "Envoyer le signalement"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * COMMENTS
 * ========================================================================== */

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

  const comments = useQuery(api.shortVideos.getComments, { videoId }) as
    | CommentItem[]
    | undefined;

  const addComment = useMutation(api.shortVideos.addComment);
  const replyToComment = useMutation(api.shortVideos.replyToComment);
  const deleteComment = useMutation(api.shortVideos.deleteComment);
  const toggleCommentLike = useMutation(api.shortVideos.toggleCommentLike);

  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Id<"shortVideoComments"> | null>(
    null,
  );
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    const value = text.trim();

    if (!value || sending) {
      return;
    }

    setSending(true);

    try {
      await addComment({ videoId, text: value });

      setText("");
      onCommentAdded?.();
      toast.success("Commentaire publié.");
    } catch (error) {
      toast.error(
        getErrorMessage(error) || "Impossible de publier le commentaire.",
      );
    } finally {
      setSending(false);
    }
  }, [addComment, onCommentAdded, sending, text, videoId]);

  const handleReply = useCallback(
    async (parentCommentId: Id<"shortVideoComments">) => {
      const value = replyText.trim();

      if (!value || sending) {
        return;
      }

      setSending(true);

      try {
        await replyToComment({ videoId, parentCommentId, text: value });

        setReplyText("");
        setReplyingTo(null);
        onCommentAdded?.();
        toast.success("Réponse publiée.");
      } catch (error) {
        toast.error(
          getErrorMessage(error) || "Impossible de publier la réponse.",
        );
      } finally {
        setSending(false);
      }
    },
    [onCommentAdded, replyText, replyToComment, sending, videoId],
  );

  const handleDelete = useCallback(
    async (commentId: Id<"shortVideoComments">) => {
      try {
        await deleteComment({ commentId });
        toast.success("Commentaire supprimé.");
      } catch (error) {
        toast.error(
          getErrorMessage(error) || "Impossible de supprimer le commentaire.",
        );
      }
    },
    [deleteComment],
  );

  const handleLikeComment = useCallback(
    async (commentId: Id<"shortVideoComments">) => {
      if (!isAuthenticated) {
        toast("Connectez-vous pour aimer un commentaire.");
        return;
      }

      try {
        await toggleCommentLike({ commentId });
      } catch (error) {
        toast.error(
          getErrorMessage(error) || "Impossible de modifier le like.",
        );
      }
    },
    [isAuthenticated, toggleCommentLike],
  );

  const roots = useMemo(
    () => (comments ?? []).filter((comment) => !comment.parentCommentId),
    [comments],
  );

  const repliesByParent = useMemo(() => {
    const map = new Map<string, CommentItem[]>();

    for (const comment of comments ?? []) {
      if (!comment.parentCommentId) {
        continue;
      }

      const key = String(comment.parentCommentId);
      const existing = map.get(key) ?? [];

      existing.push(comment);
      map.set(key, existing);
    }

    return map;
  }, [comments]);

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.commentsSheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <MessageCircle size={17} color={COLORS.purpleBright} />

            <Text style={styles.sheetTitle}>Commentaires</Text>

            {comments ? (
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{comments.length}</Text>
              </View>
            ) : null}
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={17} color={COLORS.white} />
          </Pressable>
        </View>

        <View style={styles.commentsBody}>
          {comments === undefined ? (
            <View style={styles.commentsLoading}>
              <ActivityIndicator color={COLORS.purpleBright} />

              <Text style={styles.commentsLoadingText}>Chargement…</Text>
            </View>
          ) : roots.length === 0 ? (
            <View style={styles.commentsEmpty}>
              <MessageCircle size={30} color={COLORS.faint} />

              <Text style={styles.commentsEmptyTitle}>Aucun commentaire</Text>

              <Text style={styles.commentsEmptyText}>
                Soyez le premier à participer à la conversation.
              </Text>
            </View>
          ) : (
            <View style={styles.commentList}>
              {roots.map((comment) => {
                const replies = repliesByParent.get(String(comment._id)) ?? [];

                return (
                  <View key={comment._id}>
                    <View style={styles.commentItem}>
                      <Avatar
                        name={comment.userName}
                        avatar={comment.userAvatar}
                        size={35}
                      />

                      <View style={styles.commentContent}>
                        <Text style={styles.commentAuthor}>
                          {comment.userName}
                        </Text>

                        <Text style={styles.commentText}>
                          {comment.isDeleted
                            ? "Commentaire supprimé"
                            : comment.text}
                        </Text>

                        <View style={styles.commentMeta}>
                          <Pressable
                            onPress={() => {
                              void handleLikeComment(comment._id);
                            }}
                            style={styles.commentMetaButton}
                          >
                            <Heart
                              size={13}
                              color={
                                comment.likedByMe ? COLORS.red : COLORS.subtle
                              }
                              fill={
                                comment.likedByMe ? COLORS.red : "transparent"
                              }
                            />

                            <Text style={styles.commentMetaText}>
                              {formatCount(comment.likeCount)}
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setReplyingTo(comment._id);
                            }}
                            style={styles.commentMetaButton}
                          >
                            <Text style={styles.commentMetaText}>Répondre</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              void handleDelete(comment._id);
                            }}
                            style={styles.commentMetaButton}
                          >
                            <Trash2 size={12} color={COLORS.subtle} />
                          </Pressable>
                        </View>
                      </View>
                    </View>

                    {replies.length > 0 ? (
                      <View style={styles.replyList}>
                        {replies.map((reply) => (
                          <View key={reply._id} style={styles.replyItem}>
                            <Avatar
                              name={reply.userName}
                              avatar={reply.userAvatar}
                              size={28}
                            />

                            <View style={styles.commentContent}>
                              <Text style={styles.commentAuthor}>
                                {reply.userName}
                              </Text>

                              <Text style={styles.commentText}>
                                {reply.isDeleted
                                  ? "Réponse supprimée"
                                  : reply.text}
                              </Text>

                              <Pressable
                                onPress={() => {
                                  void handleLikeComment(reply._id);
                                }}
                                style={styles.commentMetaButton}
                              >
                                <Heart
                                  size={12}
                                  color={
                                    reply.likedByMe ? COLORS.red : COLORS.subtle
                                  }
                                  fill={
                                    reply.likedByMe ? COLORS.red : "transparent"
                                  }
                                />

                                <Text style={styles.commentMetaText}>
                                  {formatCount(reply.likeCount)}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {replyingTo === comment._id ? (
                      <View style={styles.replyComposer}>
                        <TextInput
                          value={replyText}
                          onChangeText={setReplyText}
                          maxLength={1000}
                          placeholder="Votre réponse…"
                          placeholderTextColor={COLORS.subtle}
                          style={styles.replyInput}
                        />

                        <Pressable
                          disabled={sending || !replyText.trim()}
                          onPress={() => {
                            void handleReply(comment._id);
                          }}
                          style={[
                            styles.sendButton,
                            (!replyText.trim() || sending) &&
                              styles.sendButtonDisabled,
                          ]}
                        >
                          <Send size={14} color={COLORS.white} />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.commentComposer}>
          {isAuthenticated ? (
            <>
              <TextInput
                value={text}
                onChangeText={setText}
                editable={!sending}
                maxLength={1000}
                multiline
                placeholder="Ajouter un commentaire…"
                placeholderTextColor={COLORS.subtle}
                style={styles.commentInput}
              />

              <Pressable
                disabled={sending || !text.trim()}
                onPress={() => {
                  void handleSend();
                }}
                style={[
                  styles.sendButton,
                  (!text.trim() || sending) && styles.sendButtonDisabled,
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

/* ============================================================================
 * VIDEO PLAYER
 * ========================================================================== */

function ReelVideoPlayer({
  video,
  active,
  muted,
  paused,
  speed,
  onProgress,
  onEnded,
  onError,
}: {
  video: VideoItem;
  active: boolean;
  muted: boolean;
  paused: boolean;
  speed: Speed;
  onProgress: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onError: (message: string) => void;
}) {
  const source = resolveVideoSource(video);

  const player = useVideoPlayer(source ?? "", (instance) => {
    instance.loop = false;
    instance.muted = true;
    instance.playbackRate = 1;
    instance.timeUpdateEventInterval = 0.5;

    if (active) {
      instance.play();
    }
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    player.playbackRate = speed;
  }, [player, speed]);

  useEffect(() => {
    if (!active || paused) {
      player.pause();
      return;
    }

    player.play();
  }, [active, paused, player]);

  useEffect(() => {
    const timeSubscription = player.addListener(
      "timeUpdate",
      ({ currentTime }) => {
        onProgress(currentTime, safeNumber(player.duration));
      },
    );

    const endSubscription = player.addListener("playToEnd", () => {
      onEnded();
    });

    const statusSubscription = player.addListener(
      "statusChange",
      ({ status, error }) => {
        if (status === "error") {
          onError(error?.message ?? "Impossible de lire cette vidéo.");
        }
      },
    );

    return () => {
      timeSubscription.remove();
      endSubscription.remove();
      statusSubscription.remove();
    };
  }, [onEnded, onError, onProgress, player]);

  if (!source) {
    return (
      <View style={styles.videoUnavailable}>
        <Play size={32} color={COLORS.subtle} />

        <Text style={styles.videoUnavailableText}>
          Média vidéo indisponible
        </Text>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
      surfaceType="textureView"
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

/* ============================================================================
 * ANALYTICS
 * ========================================================================== */

function AnalyticsSheet({
  videoId,
  onClose,
}: {
  videoId: Id<"shortVideos">;
  onClose: () => void;
}) {
  const analytics = useQuery(api.shortVideos.getAnalytics, { videoId }) as
    | AnalyticsData
    | undefined;

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.analyticsSheet}>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <BarChart3 size={17} color={COLORS.purpleBright} />

            <Text style={styles.sheetTitle}>Analytics</Text>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={17} color={COLORS.white} />
          </Pressable>
        </View>

        {analytics === undefined ? (
          <View style={styles.analyticsLoading}>
            <ActivityIndicator color={COLORS.purpleBright} />

            <Text style={styles.commentsLoadingText}>
              Chargement des analytics…
            </Text>
          </View>
        ) : (
          <View style={styles.analyticsGrid}>
            <AnalyticsCard
              label="Vues"
              value={formatCount(analytics.viewCount)}
            />

            <AnalyticsCard
              label="Vues comptées"
              value={formatCount(analytics.countedViews)}
            />

            <AnalyticsCard
              label="Likes"
              value={formatCount(analytics.likeCount)}
            />

            <AnalyticsCard
              label="Commentaires"
              value={formatCount(analytics.commentCount)}
            />

            <AnalyticsCard
              label="Partages"
              value={formatCount(analytics.shareCount)}
            />

            <AnalyticsCard
              label="Sauvegardes"
              value={formatCount(analytics.saveCount)}
            />

            <AnalyticsCard
              label="Watch time"
              value={formatDuration(analytics.totalWatchedMs)}
            />

            <AnalyticsCard
              label="Moyenne / vue"
              value={formatDuration(analytics.averageWatchMs)}
            />

            <AnalyticsCard
              label="Complétion"
              value={`${Math.round(analytics.completionRate * 100)}%`}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function AnalyticsCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.analyticsCard}>
      <Text style={styles.analyticsLabel}>{label}</Text>

      <Text style={styles.analyticsValue}>{value}</Text>
    </View>
  );
}

/* ============================================================================
 * UPLOAD
 * ========================================================================== */

function UploadSheet({
  onClose,
  onPublished,
}: {
  onClose: () => void;
  onPublished?: (videoId: Id<"shortVideos">) => void;
}) {
  const generateUploadUrl = useMutation(api.shortVideos.generateUploadUrl);

  const createVideo = useMutation(api.shortVideos.create);

  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [soundName, setSoundName] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [uploading, setUploading] = useState(false);

  const pickVideo = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        toast.error("L’accès à la galerie est nécessaire.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsMultipleSelection: false,
        selectionLimit: 1,
        quality: 1,
        videoMaxDuration: 600,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selected = result.assets[0];

      if (selected.type !== "video") {
        toast.error("Sélectionnez une vidéo.");
        return;
      }

      if (selected.fileSize && selected.fileSize > 250 * 1024 * 1024) {
        toast.error("La vidéo dépasse la limite de 250 MB.");
        return;
      }

      setAsset(selected);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Impossible d’ouvrir la galerie.");
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = caption.trim();

    if (!asset) {
      toast.error("Sélectionnez une vidéo.");
      return;
    }

    if (!text) {
      toast.error("La légende est obligatoire.");
      return;
    }

    if (text.length > 2200) {
      toast.error("La légende dépasse 2200 caractères.");
      return;
    }

    if (uploading) {
      return;
    }

    setUploading(true);

    try {
      const uploadUrl = await generateUploadUrl({});

      const response = await fetch(asset.uri);

      if (!response.ok) {
        throw new Error("Impossible de lire le fichier vidéo local.");
      }

      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": asset.mimeType ?? "video/mp4",
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("L’upload Convex Storage a échoué.");
      }

      const uploadJson = (await uploadResponse.json()) as {
        storageId?: Id<"_storage">;
      };

      if (!uploadJson.storageId) {
        throw new Error("Convex n’a pas retourné de storageId.");
      }

      const duration =
        typeof asset.duration === "number" && Number.isFinite(asset.duration)
          ? asset.duration / 1000
          : undefined;

      const videoId = await createVideo({
        videoStorageId: uploadJson.storageId,
        caption: text,
        hashtags: normalizeHashtags(hashtags),
        duration,
        soundName: soundName.trim() || undefined,
        visibility,
      });

      toast.success("Reel envoyé pour modération.");

      onPublished?.(videoId);

      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error) || "La publication du Reel a échoué.");
    } finally {
      setUploading(false);
    }
  }, [
    asset,
    caption,
    createVideo,
    generateUploadUrl,
    hashtags,
    onClose,
    onPublished,
    soundName,
    uploading,
    visibility,
  ]);

  return (
    <View style={styles.modalOverlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.uploadSheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <View style={styles.sheetTitleRow}>
            <Upload size={18} color={COLORS.purpleBright} />

            <Text style={styles.sheetTitle}>Publier un Reel</Text>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={17} color={COLORS.white} />
          </Pressable>
        </View>

        <Pressable
          disabled={uploading}
          onPress={() => {
            void pickVideo();
          }}
          style={styles.videoPicker}
        >
          {asset ? (
            <>
              <View style={styles.videoPickerIcon}>
                <Check size={20} color={COLORS.green} />
              </View>

              <View style={styles.videoPickerCopy}>
                <Text style={styles.videoPickerTitle}>Vidéo sélectionnée</Text>

                <Text style={styles.videoPickerSubtitle} numberOfLines={2}>
                  {asset.fileName ?? asset.uri}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.videoPickerIcon}>
                <Upload size={20} color={COLORS.purpleBright} />
              </View>

              <View style={styles.videoPickerCopy}>
                <Text style={styles.videoPickerTitle}>Choisir une vidéo</Text>

                <Text style={styles.videoPickerSubtitle}>
                  Convex Storage · jusqu’à 250 MB
                </Text>
              </View>
            </>
          )}
        </Pressable>

        <Text style={styles.fieldLabel}>Légende *</Text>

        <TextInput
          value={caption}
          onChangeText={setCaption}
          editable={!uploading}
          multiline
          maxLength={2200}
          placeholder="Racontez votre vidéo…"
          placeholderTextColor={COLORS.subtle}
          style={[styles.input, styles.multilineInput]}
        />

        <Text style={styles.fieldLabel}>Hashtags</Text>

        <TextInput
          value={hashtags}
          onChangeText={setHashtags}
          editable={!uploading}
          autoCapitalize="none"
          placeholder="#business #afrique #tech"
          placeholderTextColor={COLORS.subtle}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Son</Text>

        <TextInput
          value={soundName}
          onChangeText={setSoundName}
          editable={!uploading}
          placeholder="Nom du son / musique original"
          placeholderTextColor={COLORS.subtle}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Visibilité</Text>

        <View style={styles.visibilityRow}>
          {(
            [
              ["public", "Public"],
              ["followers", "Abonnés"],
              ["private", "Privé"],
            ] as const
          ).map(([value, label]) => {
            const selected = visibility === value;

            return (
              <Pressable
                key={value}
                onPress={() => setVisibility(value)}
                style={[
                  styles.visibilityOption,
                  selected && styles.visibilityOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.visibilityText,
                    selected && styles.visibilityTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          disabled={uploading || !asset}
          onPress={() => {
            void handleSubmit();
          }}
          style={[
            styles.publishButton,
            (uploading || !asset) && styles.disabled,
          ]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Upload size={17} color={COLORS.white} />
          )}

          <Text style={styles.publishButtonText}>
            {uploading ? "Upload + publication…" : "Publier le Reel"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * REEL
 * ============================================================================
 * Règle : un Reel n'est interactif que s'il est `approved` ET `active`.
 *
 *   VIEWABLE (visible dans Mes Reels même pending/rejected)
 *      ≠
 *   INTERACTIVE (like / comment / save / share uniquement après approbation)
 *
 * Le backend `assertVideoInteractive` applique déjà cette règle côté
 * serveur. Le frontend la reflète pour :
 *   - éviter les erreurs VIDEO_NOT_FOUND / VIDEO_NOT_AVAILABLE
 *   - clarifier l'UX (boutons grisés sur les Reels en attente)
 *
 * La sécurité réelle reste au backend : même si on contourne le bouton,
 * la mutation Convex refusera l'action.
 * ========================================================================== */

function Reel({
  video,
  active,
  mode,
  onSwipeUp,
  onSwipeDown,
}: {
  video: VideoItem;
  active: boolean;
  mode: ReelsMode;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onPublished?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const { isAuthenticated } = useConvexAuth();

  /**
   * Verrou d'interaction aligné sur le backend.
   *
   * Utilisé pour désactiver like / comment / save / share sur les
   * Reels pending ou rejected. Le Reel reste jouable et visible
   * dans Mes Reels (VIEWABLE), mais aucune action sociale n'est
   * possible tant qu'il n'est pas approuvé (NON-INTERACTIVE).
   */
  const canInteract =
    video.isActive === true && video.moderationStatus === "approved";

  const toggleLike = useMutation(api.shortVideos.toggleLike);
  const toggleSave = useMutation(api.shortVideos.toggleSave);
  const recordShare = useMutation(api.shortVideos.recordShare);
  const recordView = useMutation(api.shortVideos.recordView);

  const [liked, setLiked] = useState(Boolean(video.likedByMe));
  const [likeCount, setLikeCount] = useState(safeNumber(video.likeCount));
  const [saved, setSaved] = useState(Boolean(video.savedByMe));
  const [saveCount, setSaveCount] = useState(safeNumber(video.saveCount));
  const [shareCount, setShareCount] = useState(safeNumber(video.shareCount));

  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [showSpeed, setShowSpeed] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const [progress, setProgress] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const lastTap = useRef(0);
  const startY = useRef<number | null>(null);

  const watchedMsRef = useRef(0);
  const lastPlayerTime = useRef(0);
  const lastReportedMs = useRef(0);
  const sessionIdRef = useRef(createSessionId());

  const sendView = useCallback(
    async (force = false, completed = false) => {
      const watchedMs = Math.max(0, Math.round(watchedMsRef.current));

      if (
        watchedMs <= 0 ||
        (!force && watchedMs - lastReportedMs.current < 2000)
      ) {
        return;
      }

      lastReportedMs.current = watchedMs;

      try {
        await recordView({
          videoId: video._id,
          sessionId: sessionIdRef.current,
          watchedMs,
          completed,
        });
      } catch {
        // Le suivi analytique ne doit pas
        // interrompre la lecture.
      }
    },
    [recordView, video._id],
  );

  const handleProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!Number.isFinite(currentTime)) {
        return;
      }

      if (!paused && currentTime >= lastPlayerTime.current) {
        const delta = currentTime - lastPlayerTime.current;

        if (delta > 0 && delta < 3) {
          watchedMsRef.current += delta * 1000;
        }
      }

      lastPlayerTime.current = currentTime;

      if (duration > 0) {
        setProgress(Math.min(1, Math.max(0, currentTime / duration)));
      }

      if (watchedMsRef.current - lastReportedMs.current >= 5000) {
        void sendView();
      }
    },
    [paused, sendView],
  );

  useEffect(() => {
    return () => {
      void sendView(true, false);
    };
  }, [sendView]);

  useEffect(() => {
    if (!active) {
      return;
    }

    setPaused(false);
    setProgress(0);
    setPlayerError(null);

    watchedMsRef.current = 0;
    lastPlayerTime.current = 0;
    lastReportedMs.current = 0;
  }, [active, video._id]);

  const handleEnded = useCallback(() => {
    setProgress(1);
    void sendView(true, true);
  }, [sendView]);

  const handleLike = useCallback(async () => {
    if (!canInteract) {
      toast("Ce Reel sera interactif après validation.");
      return;
    }

    if (!isAuthenticated) {
      toast("Connectez-vous pour aimer cette vidéo.");
      return;
    }

    try {
      const result = await toggleLike({ videoId: video._id });

      setLiked(result.liked);
      setLikeCount(safeNumber(result.likeCount));

      if (result.liked) {
        setShowHeart(true);

        setTimeout(() => {
          setShowHeart(false);
        }, 650);
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error) || "Impossible de modifier votre réaction.",
      );
    }
  }, [canInteract, isAuthenticated, toggleLike, video._id]);

  const handleSave = useCallback(async () => {
    if (!canInteract) {
      toast("Ce Reel sera sauvegardable après validation.");
      return;
    }

    if (!isAuthenticated) {
      toast("Connectez-vous pour sauvegarder ce Reel.");
      return;
    }

    try {
      const result = await toggleSave({ videoId: video._id });

      setSaved(result.saved);
      setSaveCount(safeNumber(result.saveCount));

      toast.success(
        result.saved ? "Reel sauvegardé." : "Reel retiré des sauvegardes.",
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error) || "Impossible de modifier la sauvegarde.",
      );
    }
  }, [canInteract, isAuthenticated, toggleSave, video._id]);

  const handleShare = useCallback(async () => {
    if (!canInteract) {
      toast("Le partage sera disponible après validation du Reel.");
      return;
    }

    try {
      const shareUrl = resolveVideoSource(video) ?? video.videoUrl ?? undefined;

      const result = await Share.share({
        message: video.caption,
        url: shareUrl,
      });

      if (result.action === Share.sharedAction) {
        const shareResult = await recordShare({
          videoId: video._id,
          channel: "native",
        });

        setShareCount(safeNumber(shareResult.shareCount));
      }
    } catch {
      // Annulation native du partage :
      // aucune erreur produit.
    }
  }, [
    canInteract,
    recordShare,
    video._id,
    video.caption,
    video.videoUrl,
    video.videoUrlResolved,
  ]);

  const handleTap = useCallback(() => {
    const now = Date.now();

    if (now - lastTap.current < 280) {
      lastTap.current = 0;

      // Le double-tap déclenche un like UNIQUEMENT si le Reel est
      // interactif. Sinon, on ignore silencieusement : c'est un
      // simple tap de pause/reprise qui a été doublé.
      if (canInteract && !liked) {
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
  }, [canInteract, handleLike, liked]);

  const handleTouchStart = useCallback(
    (event: { nativeEvent: { pageY: number } }) => {
      startY.current = event.nativeEvent.pageY;
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (event: { nativeEvent: { pageY: number } }) => {
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

  const moderationBadge =
    mode === "mine" ? getModerationBadge(video.moderationStatus) : null;

  const thumbnailSource = resolveThumbnailSource(video);

  return (
    <View
      style={[styles.reel, { width, height }]}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {thumbnailSource ? (
        <Image
          source={{ uri: thumbnailSource }}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          paused ? "Lire la vidéo" : "Mettre la vidéo en pause"
        }
        onPress={handleTap}
        style={StyleSheet.absoluteFill}
      >
        {active ? (
          <ReelVideoPlayer
            video={video}
            active={active}
            muted={muted}
            paused={paused}
            speed={speed}
            onProgress={handleProgress}
            onEnded={handleEnded}
            onError={setPlayerError}
          />
        ) : null}
      </Pressable>

      <View pointerEvents="none" style={styles.reelGradientTop} />

      <View pointerEvents="none" style={styles.reelGradientBottom} />

      <View pointerEvents="none" style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(progress * 100)}%`,
            },
          ]}
        />
      </View>

      {playerError ? (
        <View pointerEvents="none" style={styles.videoErrorOverlay}>
          <Text style={styles.videoErrorTitle}>Lecture impossible</Text>

          <Text style={styles.videoErrorText}>{playerError}</Text>
        </View>
      ) : null}

      {showHeart ? (
        <View pointerEvents="none" style={styles.heartOverlay}>
          <Heart size={88} color={COLORS.red} fill={COLORS.red} />
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
          accessibilityLabel="Vitesse de lecture"
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
          accessibilityLabel={
            canInteract
              ? liked
                ? "Retirer le j'aime"
                : "Aimer"
              : "Réactions disponibles après validation"
          }
          disabled={!canInteract}
          onPress={() => {
            void handleLike();
          }}
          style={[styles.action, !canInteract && styles.actionDisabled]}
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
          accessibilityLabel={
            canInteract
              ? "Commentaires"
              : "Commentaires disponibles après validation"
          }
          disabled={!canInteract}
          onPress={() => {
            if (!canInteract) {
              toast(
                "Les commentaires seront disponibles après validation du Reel.",
              );
              return;
            }

            setShowComments(true);
          }}
          style={[styles.action, !canInteract && styles.actionDisabled]}
        >
          <MessageCircle size={29} color={COLORS.white} />

          <Text style={styles.actionCount}>
            {formatCount(video.commentCount)}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            canInteract ? "Partager" : "Partage disponible après validation"
          }
          disabled={!canInteract}
          onPress={() => {
            void handleShare();
          }}
          style={[styles.action, !canInteract && styles.actionDisabled]}
        >
          <Share2 size={28} color={COLORS.white} />

          <Text style={styles.actionCount}>{formatCount(shareCount)}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            canInteract
              ? saved
                ? "Retirer des sauvegardes"
                : "Sauvegarder"
              : "Sauvegarde disponible après validation"
          }
          disabled={!canInteract}
          onPress={() => {
            void handleSave();
          }}
          style={[styles.action, !canInteract && styles.actionDisabled]}
        >
          <Bookmark
            size={27}
            color={saved ? COLORS.yellow : COLORS.white}
            fill={saved ? COLORS.yellow : "transparent"}
          />

          <Text style={styles.actionCount}>{formatCount(saveCount)}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Signaler"
          onPress={() => setShowReport(true)}
          style={styles.action}
        >
          <Flag size={24} color={COLORS.white} />
        </Pressable>

        {video.authorId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Analytics du Reel"
            onPress={() => setShowAnalytics(true)}
            style={styles.action}
          >
            <BarChart3 size={24} color={COLORS.white} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.creatorBlock}>
        <View style={styles.creatorRow}>
          <Avatar
            name={video.authorName}
            avatar={video.authorAvatar}
            size={43}
          />

          <View style={styles.creatorInfo}>
            <View style={styles.creatorNameRow}>
              <Text style={styles.creatorName} numberOfLines={1}>
                {video.authorName ?? "Utilisateur"}
              </Text>

              {video.isPinned ? (
                <ShieldCheck size={13} color={COLORS.purpleBright} />
              ) : null}
            </View>

            <Text style={styles.creatorViews}>
              {formatCount(video.viewCount)} vues ·{" "}
              {video.visibility === "followers"
                ? "Abonnés"
                : video.visibility === "private"
                  ? "Privé"
                  : "Public"}
            </Text>
          </View>

          <FollowButton authorId={video.authorId} />
        </View>

        <Text style={styles.caption} numberOfLines={5}>
          {video.caption}
        </Text>

        {video.soundName ? (
          <Text style={styles.soundName} numberOfLines={1}>
            ♪ {video.soundName}
          </Text>
        ) : null}

        {video.hashtags.length > 0 ? (
          <View style={styles.hashtagRow}>
            {video.hashtags.slice(0, 8).map((tag) => (
              <Text key={tag} style={styles.hashtag}>
                #{tag}
              </Text>
            ))}
          </View>
        ) : null}

        {moderationBadge ? (
          <View
            style={[
              styles.moderationBadge,
              moderationBadge.tone === "approved" &&
                styles.moderationBadgeApproved,
              moderationBadge.tone === "rejected" &&
                styles.moderationBadgeRejected,
            ]}
          >
            <Text
              style={[
                styles.moderationBadgeText,
                moderationBadge.tone === "approved" &&
                  styles.moderationBadgeTextApproved,
                moderationBadge.tone === "rejected" &&
                  styles.moderationBadgeTextRejected,
              ]}
            >
              {moderationBadge.label}
            </Text>
          </View>
        ) : null}
      </View>

      {showComments ? (
        <CommentsSheet
          videoId={video._id}
          onClose={() => setShowComments(false)}
        />
      ) : null}

      {showReport ? (
        <ReportSheet videoId={video._id} onClose={() => setShowReport(false)} />
      ) : null}

      {showAnalytics ? (
        <AnalyticsSheet
          videoId={video._id}
          onClose={() => setShowAnalytics(false)}
        />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * EMPTY
 * ========================================================================== */

function EmptyReelsState({
  authenticated,
  onBack,
  onCreate,
  mode = "public",
}: {
  authenticated: boolean;
  onBack: () => void;
  onCreate: () => void;
  mode?: ReelsMode;
}) {
  const isMine = mode === "mine";

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

      <Text style={styles.emptyReelsTitle}>
        {isMine ? "Vous n’avez publié aucun Reel" : "Aucun Reel disponible"}
      </Text>

      <Text style={styles.emptyReelsText}>
        {isMine
          ? "Publiez votre premier Reel pour le retrouver ici avec son statut de modération."
          : "Le fil ne contient actuellement aucun contenu publié et approuvé."}
      </Text>

      {authenticated ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isMine ? "Publier un Reel" : "Publier le premier Reel"
          }
          onPress={onCreate}
          style={styles.emptyCreateButton}
        >
          <Plus size={17} color={COLORS.white} />

          <Text style={styles.emptyCreateText}>
            {isMine ? "Publier un Reel" : "Publier le premier Reel"}
          </Text>
        </Pressable>
      ) : (
        <SignInButton />
      )}
    </View>
  );
}

/* ============================================================================
 * FEED VIEW
 * ========================================================================== */

function ReelsFeedView({
  onBack,
  mode,
  results,
  status,
  loadMore,
}: {
  onBack: () => void;
  mode: ReelsMode;
  results: VideoItem[];
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: (numItems: number) => void;
}) {
  const { isAuthenticated } = useConvexAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  const videos = useMemo(() => results ?? [], [results]);

  useEffect(() => {
    if (status === "CanLoadMore" && currentIndex >= videos.length - 2) {
      loadMore(5);
    }
  }, [currentIndex, loadMore, status, videos.length]);

  useEffect(() => {
    if (currentIndex >= videos.length && videos.length > 0) {
      setCurrentIndex(videos.length - 1);
    }
  }, [currentIndex, videos.length]);

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
          <Pressable onPress={onBack} style={styles.headerButton}>
            <ArrowLeft size={19} color={COLORS.white} />
          </Pressable>

          <Text style={styles.loadingHeaderTitle}>
            {mode === "mine" ? "Mes Reels" : "Reels"}
          </Text>
        </View>

        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.purpleBright} />

          <Text style={styles.loadingTitle}>
            {mode === "mine"
              ? "Chargement de vos Reels"
              : "Chargement des Reels"}
          </Text>

          <Text style={styles.loadingText}>
            {mode === "mine"
              ? "Récupération de votre bibliothèque…"
              : "Récupération du contenu réel depuis Convex…"}
          </Text>
        </View>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <>
        <EmptyReelsState
          authenticated={isAuthenticated}
          onBack={onBack}
          onCreate={() => setShowUpload(true)}
          mode={mode}
        />

        {showUpload ? (
          <UploadSheet onClose={() => setShowUpload(false)} />
        ) : null}
      </>
    );
  }

  const currentVideo = videos[currentIndex];

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
          <Text style={styles.reelsTitle}>
            {mode === "mine" ? "Mes Reels" : "Reels"}
          </Text>

          <Text style={styles.reelsCounter}>
            {currentIndex + 1} / {videos.length}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {mode === "public" ? (
            <View style={styles.headerStatus}>
              <View style={styles.liveDot} />

              <Text style={styles.headerStatusText}>LIVE</Text>
            </View>
          ) : null}

          <View style={styles.headerButton}>
            <Hash size={18} color={COLORS.purpleBright} />
          </View>
        </View>
      </View>

      <Reel
        key={`${mode}-${String(currentVideo._id)}`}
        video={currentVideo}
        active
        mode={mode}
        onSwipeUp={() => goTo(currentIndex + 1)}
        onSwipeDown={() => goTo(currentIndex - 1)}
      />

      {videos.length > 1 ? (
        <View pointerEvents="none" style={styles.pageIndicator}>
          {videos.slice(0, 10).map((video, index) => (
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
        <View pointerEvents="box-none" style={styles.floatingPublishWrap}>
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
        </View>
      </Authenticated>

      <Unauthenticated>
        <View style={styles.signInFloating}>
          <SignInButton />
        </View>
      </Unauthenticated>

      {showUpload ? <UploadSheet onClose={() => setShowUpload(false)} /> : null}

      {status === "LoadingMore" ? (
        <View pointerEvents="none" style={styles.loadingMoreWrap}>
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={COLORS.white} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * DATA SOURCES
 * ========================================================================== */

function PublicReelsData({ onBack }: { onBack: () => void }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.shortVideos.list,
    {},
    { initialNumItems: 5 },
  );

  return (
    <ReelsFeedView
      onBack={onBack}
      mode="public"
      results={(results ?? []) as unknown as VideoItem[]}
      status={status}
      loadMore={loadMore}
    />
  );
}

function MyReelsData({ onBack }: { onBack: () => void }) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.shortVideos.listMine,
    {},
    { initialNumItems: 5 },
  );

  return (
    <ReelsFeedView
      onBack={onBack}
      mode="mine"
      results={(results ?? []) as unknown as VideoItem[]}
      status={status}
      loadMore={loadMore}
    />
  );
}

/* ============================================================================
 * ROUTER
 * ========================================================================== */

export default function ReelsPage({ onBack, mode = "public" }: ReelsPageProps) {
  const { width, height } = useWindowDimensions();

  const content =
    mode === "mine" ? (
      <MyReelsData onBack={onBack} />
    ) : (
      <PublicReelsData onBack={onBack} />
    );

  if (Platform.OS === "web") {
    return content;
  }

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={onBack}
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={[styles.modalRoot, { width, height }]}>{content}</View>
    </Modal>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  modalRoot: {
    backgroundColor: COLORS.black,
    overflow: "hidden",
  },

  screen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.black,
  },

  reel: {
    overflow: "hidden",
    backgroundColor: COLORS.black,
  },

  reelsHeader: {
    position: "absolute",
    zIndex: 50,
    top: 0,
    left: 0,
    right: 0,
    paddingTop: TOP_INSET + 8,
    paddingHorizontal: 15,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerStatus: {
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.46)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },

  headerStatusText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: "900",
  },

  headerButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.46)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  reelsHeaderCenter: {
    alignItems: "center",
  },

  reelsTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },

  reelsCounter: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },

  reelGradientTop: {
    position: "absolute",
    zIndex: 3,
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  reelGradientBottom: {
    position: "absolute",
    zIndex: 3,
    bottom: 0,
    left: 0,
    right: 0,
    height: 330,
    backgroundColor: "rgba(0,0,0,0.50)",
  },

  progressTrack: {
    position: "absolute",
    zIndex: 40,
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  progressFill: {
    height: 2,
    backgroundColor: COLORS.purpleBright,
  },

  videoControls: {
    position: "absolute",
    zIndex: 20,
    top: TOP_INSET + 67,
    right: 15,
    gap: 8,
  },

  controlButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.54)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  controlButtonActive: {
    backgroundColor: "rgba(139,92,246,0.54)",
    borderColor: "rgba(167,139,250,0.45)",
  },

  speedPicker: {
    position: "absolute",
    zIndex: 70,
    top: TOP_INSET + 113,
    right: 15,
    width: 130,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(5,8,18,0.98)",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  speedHeader: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    minHeight: 38,
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

  actions: {
    position: "absolute",
    zIndex: 20,
    right: 11,
    bottom: 118,
    alignItems: "center",
    gap: 18,
  },

  action: {
    minWidth: 45,
    alignItems: "center",
    gap: 4,
  },

  /**
   * Ajouté : état visuel des actions d'interaction désactivées
   * lorsque le Reel n'est pas encore approuvé (pending ou rejected).
   *
   * Le backend refuse déjà ces actions. Cet état reflète la même
   * règle côté UI pour éviter l'erreur VIDEO_NOT_FOUND et clarifier
   * le retour utilisateur.
   */
  actionDisabled: {
    opacity: 0.35,
  },

  actionCount: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },

  creatorBlock: {
    position: "absolute",
    zIndex: 20,
    left: 15,
    right: 75,
    bottom: 27,
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

  creatorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  creatorName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
    flexShrink: 1,
  },

  creatorViews: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  followButton: {
    minHeight: 31,
    paddingHorizontal: 10,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(139,92,246,0.36)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.40)",
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

  soundName: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 7,
  },

  hashtagRow: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  hashtag: {
    color: "#C4B5FD",
    fontSize: 10,
    fontWeight: "800",
  },

  moderationBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(251,146,60,0.16)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.28)",
  },

  moderationBadgeApproved: {
    backgroundColor: "rgba(52,211,153,0.16)",
    borderColor: "rgba(52,211,153,0.32)",
  },

  moderationBadgeRejected: {
    backgroundColor: "rgba(251,113,133,0.16)",
    borderColor: "rgba(251,113,133,0.32)",
  },

  moderationBadgeText: {
    color: COLORS.orange,
    fontSize: 8,
    fontWeight: "900",
  },

  moderationBadgeTextApproved: {
    color: COLORS.green,
  },

  moderationBadgeTextRejected: {
    color: COLORS.red,
  },

  heartOverlay: {
    position: "absolute",
    zIndex: 30,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  centerPlay: {
    position: "absolute",
    zIndex: 25,
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

  videoUnavailable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.black,
  },

  videoUnavailableText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  videoErrorOverlay: {
    position: "absolute",
    zIndex: 18,
    left: 25,
    right: 25,
    top: "42%",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.25)",
  },

  videoErrorTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  videoErrorText: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
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

  pageIndicator: {
    position: "absolute",
    zIndex: 30,
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

  floatingPublishWrap: {
    position: "absolute",
    zIndex: 60,
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: "center",
  },

  floatingPublish: {
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
  },

  floatingPublishText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },

  signInFloating: {
    position: "absolute",
    zIndex: 60,
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: "center",
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.68)",
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

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  commentsSheet: {
    maxHeight: "82%",
    minHeight: "48%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  commentsBody: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },

  commentList: {
    gap: 4,
  },

  commentItem: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  replyList: {
    marginLeft: 44,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.10)",
    paddingLeft: 10,
  },

  replyItem: {
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
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
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  commentMeta: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  commentMetaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  commentMetaText: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: "800",
  },

  replyComposer: {
    marginLeft: 44,
    paddingVertical: 5,
    flexDirection: "row",
    gap: 7,
  },

  replyInput: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 11,
    color: COLORS.white,
    fontSize: 11,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
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

  reportSheet: {
    paddingBottom: 25,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reportReasons: {
    paddingHorizontal: 17,
    paddingVertical: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  reportReason: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reportReasonSelected: {
    backgroundColor: "rgba(251,113,133,0.13)",
    borderColor: "rgba(251,113,133,0.32)",
  },

  reportReasonText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
  },

  reportReasonTextSelected: {
    color: COLORS.red,
  },

  uploadSheet: {
    maxHeight: "94%",
    paddingHorizontal: 17,
    paddingBottom: 24,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  videoPicker: {
    marginTop: 15,
    marginBottom: 15,
    minHeight: 78,
    paddingHorizontal: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  videoPickerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.14)",
  },

  videoPickerCopy: {
    flex: 1,
  },

  videoPickerTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  videoPickerSubtitle: {
    color: COLORS.subtle,
    fontSize: 9,
    marginTop: 3,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 8,
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
    minHeight: 90,
    textAlignVertical: "top",
  },

  visibilityRow: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 8,
  },

  visibilityOption: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  visibilityOptionSelected: {
    backgroundColor: "rgba(139,92,246,0.18)",
    borderColor: "rgba(167,139,250,0.38)",
  },

  visibilityText: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: "800",
  },

  visibilityTextSelected: {
    color: COLORS.purpleBright,
  },

  publishButton: {
    minHeight: 50,
    marginTop: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.purple,
  },

  publishButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  analyticsSheet: {
    maxHeight: "75%",
    paddingBottom: 25,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  analyticsLoading: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  analyticsGrid: {
    padding: 17,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  analyticsCard: {
    width: "31%",
    minHeight: 82,
    padding: 11,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  analyticsLabel: {
    color: COLORS.subtle,
    fontSize: 8,
    fontWeight: "800",
  },

  analyticsValue: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 8,
  },

  emptyScreen: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: COLORS.background,
  },

  emptyBack: {
    position: "absolute",
    top: TOP_INSET + 8,
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
    textAlign: "center",
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

  loadingScreen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.background,
  },

  loadingHeader: {
    paddingHorizontal: 17,
    paddingTop: TOP_INSET + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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

  loadingMoreWrap: {
    position: "absolute",
    zIndex: 80,
    left: 0,
    right: 0,
    bottom: 28,
    alignItems: "center",
  },

  loadingMore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.97 }],
  },

  disabled: {
    opacity: 0.45,
  },
});
