// app/community/[id].tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { useState, useEffect, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MoreVertical,
  Calendar,
  MapPin,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Flag,
  EyeOff,
  X,
} from "lucide-react-native";
import {
  CommunityHeader,
  CommunityGallery,
  CommunityComments,
  CommunityPoll,
  CommunityQuestion,
  CommunityHashtags,
  CommunityLocation,
  CommunityMap,
  CommunityStatistics,
  CommunityActions,
  CommunityShare,
  CommunityBoost,
} from "@/features/community/components";
import {
  useCommunityComments,
  useCommunityBookmarks,
  useCommunityNotifications,
  useCommunityAI,
} from "@/features/community/hooks";
import { adaptCommunityPost } from "@/features/community/adapter";
import type { CommunityPost } from "@/features/community/types";
import type { Id } from "@/convex/_generated/dataModel";

// ── Constantes ────────────────────────────────────────────────────────────
const APP_SHARE_BASE_URL = "https://app-template.com";

function buildShareUrl(postId: string | undefined): string {
  return `${APP_SHARE_BASE_URL}/community/${postId ?? ""}`;
}

// ── Confirmation native (corrigée : ne retourne plus toujours false) ─────
function NativeConfirmAlert(
  message: string,
  onConfirm: () => void | Promise<void>,
): void {
  Alert.alert("Confirmation", message, [
    { text: "Annuler", style: "cancel" },
    {
      text: "Confirmer",
      style: "destructive",
      onPress: () => {
        void onConfirm();
      },
    },
  ]);
}

// ── ErrorBoundary ────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{
  children: ReactNode;
  fallback: ReactNode;
}> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("❌ ErrorBoundary capturé :", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── Composants désactivés (placeholders) ─────────────────────────────────
const CommunityMedia = () => null;
const CommunityVideo = () => null;
const CommunityVoice = () => null;
const CommunityAudio = () => null;
const CommunityFiles = () => null;
const CommunityDocuments = () => null;
const CommunityStories = () => null;
const CommunityShorts = () => null;
const CommunityLive = () => null;
const CommunityLiveChat = () => null;
const CommunityReplay = () => null;
const CommunityReplies = () => null;
const CommunityReactions = () => null;
const CommunityLikes = () => null;
const CommunityBookmarks = () => null;
const CommunityQuiz = () => null;
const CommunityMentions = () => null;
const CommunityTags = () => null;
const CommunityGroup = () => null;
const CommunityGroupMembers = () => null;
const CommunityEvents = () => null;
const CommunityCalendar = () => null;
const CommunityNearby = () => null;
const CommunityCreator = () => null;
const CommunityProfile = () => null;
const CommunityBadge = () => null;
const CommunityVerification = () => null;
const CommunityAnalytics = () => null;
const CommunityInsights = () => null;
const CommunityRecommendations = () => null;
const CommunityTrending = () => null;
const CommunityAI = () => null;
const CommunityAISummary = () => null;
const CommunityAITranslate = () => null;
const CommunityAIModeration = () => null;
const CommunityModeration = () => null;
const CommunitySecurity = () => null;
const CommunityReports = () => null;
const CommunityNotifications = () => null;
const CommunityMarketplace = () => null;
const CommunityCommerce = () => null;
const CommunityJobs = () => null;
const CommunityServices = () => null;
const CommunityProperties = () => null;
const CommunityPayments = () => null;
const CommunityMonetization = () => null;
const CommunitySponsors = () => null;

export default function CommunityDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const publication = useQuery(
    api.publications.getPublication,
    id ? { id: id as any } : "skip",
  );

  const trackView = useMutation(api.publications.trackView);
  const likePost = useMutation(api.community.likePost);
  const bookmarkPost = useMutation(api.bookmarks.toggle);
  const deletePost = useMutation(api.community.deletePost);
  const votePoll = useMutation(api.community.votePoll);

  const { comments, addComment, addReply } = useCommunityComments(post?._id);
  const { addBookmark, removeBookmark } = useCommunityBookmarks();
  const { sendNotification } = useCommunityNotifications();
  const { moderateText } = useCommunityAI();

  useEffect(() => {
    if (publication === undefined) {
      setLoading(true);
      return;
    }
    if (publication) {
      try {
        const adapted = adaptCommunityPost(publication);
        setPost(adapted);
        setLoading(false);
        trackView({ publicationId: publication._id }).catch((err) =>
          console.warn("⚠️ trackView error:", err),
        );
        setReactions({ "❤️": adapted.likeCount || 0 });
        setUserReaction(adapted.likedByMe ? "❤️" : null);
      } catch (err) {
        console.error("❌ Erreur dans adaptCommunityPost :", err);
        setPost(null);
        setLoading(false);
      }
    } else {
      setPost(null);
      setLoading(false);
    }
  }, [publication, trackView]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!post) return;
    try {
      await likePost({ publicationId: post._id });
      setPost({
        ...post,
        likedByMe: !post.likedByMe,
        likeCount: post.likedByMe ? post.likeCount - 1 : post.likeCount + 1,
      });
    } catch {
      UIService.openToast("Erreur lors du like", "error");
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    try {
      await bookmarkPost({ publicationId: post._id });
      setPost({
        ...post,
        bookmarkedByMe: !post.bookmarkedByMe,
      });
      UIService.openToast(
        post.bookmarkedByMe ? "Retiré des favoris" : "Ajouté aux favoris",
        "success",
      );
    } catch {
      UIService.openToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleShare = () => setShowShare(true);
  const handleReport = () => setShowReport(true);
  const handleBoost = () => setShowBoost(true);

  const handleDelete = () => {
    if (!post) return;
    NativeConfirmAlert("Voulez-vous vraiment supprimer ce post ?", async () => {
      try {
        await deletePost({ publicationId: post._id });
        UIService.openToast("Post supprimé", "success");
        router.back();
      } catch {
        UIService.openToast("Erreur lors de la suppression", "error");
      }
    });
  };

  // ✅ Corrigé : utilise expo-clipboard au lieu de `undefined.writeText`
  const handleCopyLink = async () => {
    if (!post) return;
    try {
      await Clipboard.setStringAsync(buildShareUrl(post._id));
      UIService.openToast("Lien copié !", "success");
    } catch {
      UIService.openToast("Impossible de copier le lien", "error");
    }
    setShowMenu(false);
  };

  const handleHide = () => {
    UIService.openToast("Post masqué (fonctionnalité à implémenter)", "info");
    setShowMenu(false);
  };

  const handleEdit = () => {
    router.push(`/community/edit/${post?._id}`);
    setShowMenu(false);
  };

  const handleComment = async (text: string) => {
    if (!post) return;
    try {
      await addComment(text);
      UIService.openToast("Commentaire ajouté", "success");
    } catch {
      UIService.openToast("Erreur lors de l'ajout du commentaire", "error");
    }
  };

  const handleReply = async (text: string, parentId: string) => {
    try {
      await addReply(text, parentId as Id<"comments">);
      UIService.openToast("Réponse ajoutée", "success");
    } catch {
      UIService.openToast("Erreur lors de l'ajout de la réponse", "error");
    }
  };

  const reportContent = async ({
    postId,
    reason,
  }: {
    postId: Id<"publications">;
    reason: string;
  }) => {
    try {
      await moderateText(reason);
      UIService.openToast("Signalement envoyé", "success");
    } catch {
      UIService.openToast("Erreur lors du signalement", "error");
    }
  };

  const handleStatsLikes = () =>
    UIService.openToast("Liste des likes à venir", "info");
  const handleStatsComments = () => setShowComments(!showComments);
  const handleStatsShares = () => setShowShare(true);
  const handleStatsBookmarks = () =>
    UIService.openToast("Liste des favoris à venir", "info");

  const handleVote = async (optionId: string) => {
    if (!post) return;
    try {
      await votePoll({ publicationId: post._id, optionId });
      UIService.openToast("Vote enregistré !", "success");
    } catch {
      UIService.openToast("Erreur lors du vote", "error");
    }
  };

  const handleAnswer = async (_answer: string) => {
    UIService.openToast("Réponse aux questions bientôt disponible", "info");
  };

  const handleLikeComment = async (_commentId: string) => {
    UIService.openToast("Like des commentaires bientôt disponible", "info");
  };

  const handleAuthorClick = (authorId: string) => {
    router.push(`/profile/${authorId}`);
  };

  const handleReaction = (emoji: string) => {
    if (!post) return;
    if (emoji === userReaction) {
      setUserReaction(null);
      setReactions((prev) => {
        const newReactions = { ...prev };
        if (newReactions[emoji] && newReactions[emoji] > 0) {
          newReactions[emoji] -= 1;
          if (newReactions[emoji] === 0) delete newReactions[emoji];
        }
        return newReactions;
      });
      handleLike();
    } else {
      setUserReaction(emoji);
      setReactions((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1,
      }));
      if (!post.likedByMe) {
        handleLike();
      }
      UIService.openToast(`Réaction ${emoji} ajoutée`, "success");
    }
  };

  const handleFollow = () => {
    setIsFollowing(true);
    UIService.openToast("Vous suivez maintenant cet auteur", "success");
  };

  const handleUnfollow = () => {
    setIsFollowing(false);
    UIService.openToast("Vous ne suivez plus cet auteur", "info");
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.screen}>
        <View className="px-4 pt-12 pb-3">
          <Skeleton className="w-10 h-10 rounded-2xl" />
        </View>
        <View className="px-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-6 w-1/2 rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </View>
      </View>
    );
  }

  // ── Post introuvable ────────────────────────────────────────────────
  if (!post) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Pressable
          onPress={() => router.back()}
          className="self-start ml-4 mb-4"
        >
          <ArrowLeft size={24} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Text className="text-white/40">Post introuvable</Text>
      </View>
    );
  }

  // ── Debug ────────────────────────────────────────────────────────────
  if (debugMode) {
    return (
      <View style={styles.debugScreen}>
        <Text style={styles.debugTitle}>🔍 Données du post (debug)</Text>
        <ScrollView
          style={styles.debugScroll}
          contentContainerStyle={styles.debugScrollContent}
        >
          <Text selectable style={styles.debugPre}>
            {JSON.stringify(post, null, 2)}
          </Text>
        </ScrollView>
        <Pressable
          onPress={() => setDebugMode(false)}
          style={styles.debugButton}
        >
          <Text style={styles.debugButtonText}>Retour au rendu normal</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={[styles.debugButton, { marginTop: 12 }]}
        >
          <Text style={styles.debugButtonText}>← Retour</Text>
        </Pressable>
      </View>
    );
  }

  // ── Meta sécurisée ──────────────────────────────────────────────────
  const meta = post.meta ?? {};
  const safeMeta = {
    location: meta.location ?? "",
    latitude: meta.latitude ?? undefined,
    longitude: meta.longitude ?? undefined,
    pollOptions: meta.pollOptions ?? [],
    eventDate: meta.eventDate ?? undefined,
    eventLocation: meta.eventLocation ?? "",
    audience: meta.audience ?? "public",
    mood: meta.mood ?? undefined,
    videos: meta.videos ?? [],
    audio: meta.audio ?? [],
    mentions: meta.mentions ?? [],
    images: meta.images ?? [],
    postType: meta.postType ?? "text",
  };
  const images = safeMeta.images.length > 0 ? safeMeta.images : post.images;
  const shareUrl = buildShareUrl(post._id);

  // ── Contenu ─────────────────────────────────────────────────────────
  const renderContent = () => (
    <View className="space-y-4">
      <ErrorBoundary
        fallback={
          <View className="text-red-400 p-4">
            <Text>❌ Erreur dans CommunityHeader</Text>
          </View>
        }
      >
        <CommunityHeader
          authorId={post.authorId}
          authorName={post.authorName || "Anonyme"}
          authorAvatar={post.authorAvatar}
          createdAt={post._creationTime}
          isVerified={false}
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onViewProfile={() => handleAuthorClick(post.authorId)}
        />
      </ErrorBoundary>

      {images && images.length > 0 && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4">
              <Text>❌ Erreur dans CommunityGallery</Text>
            </View>
          }
        >
          <CommunityGallery images={images} title={post.title || "Post"} />
        </ErrorBoundary>
      )}

      {post.title && (
        <Text className="text-xl font-bold text-white leading-tight">
          {post.title}
        </Text>
      )}
      <Text className="text-white/80 text-sm leading-relaxed">
        {post.description}
      </Text>

      {post.tags.length > 0 && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4">
              <Text>❌ Erreur dans CommunityHashtags</Text>
            </View>
          }
        >
          <CommunityHashtags tags={post.tags} />
        </ErrorBoundary>
      )}

      {safeMeta.location && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4">
              <Text>❌ Erreur dans CommunityLocation</Text>
            </View>
          }
        >
          <CommunityLocation location={safeMeta.location} />
        </ErrorBoundary>
      )}
      {safeMeta.latitude && safeMeta.longitude && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4">
              <Text>❌ Erreur dans CommunityMap</Text>
            </View>
          }
        >
          <CommunityMap
            latitude={safeMeta.latitude}
            longitude={safeMeta.longitude}
          />
        </ErrorBoundary>
      )}

      {post.type === "evenement" && safeMeta.eventDate && (
        <View className="flex items-center gap-2 text-sm text-white/60 bg-white/5 rounded-xl p-3">
          <Calendar size={16} color="#A78BFA" />
          <Text style={styles.inlineText}>
            {new Date(safeMeta.eventDate).toLocaleDateString()}
          </Text>
          {safeMeta.eventLocation && (
            <>
              <Text className="text-white/20">|</Text>
              <MapPin size={16} color="#A78BFA" />
              <Text style={styles.inlineText}>{safeMeta.eventLocation}</Text>
            </>
          )}
        </View>
      )}

      {post.type === "poll" && safeMeta.pollOptions.length > 0 && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4">
              <Text>❌ Erreur dans CommunityPoll</Text>
            </View>
          }
        >
          <CommunityPoll
            options={safeMeta.pollOptions}
            votedOptionId={post.votedOptionId}
            onVote={handleVote}
          />
        </ErrorBoundary>
      )}

      {post.type === "question" && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4">
              <Text>❌ Erreur dans CommunityQuestion</Text>
            </View>
          }
        >
          <CommunityQuestion
            question={post.title || "Question"}
            onAnswer={handleAnswer}
          />
        </ErrorBoundary>
      )}

      <ErrorBoundary
        fallback={
          <View className="text-red-400 p-4">
            <Text>❌ Erreur dans CommunityStatistics</Text>
          </View>
        }
      >
        <CommunityStatistics
          views={post.viewCount}
          likes={post.likeCount}
          comments={post.commentCount}
          shares={post.shareCount || 0}
          bookmarks={post.bookmarkCount || 0}
          onLikesClick={handleStatsLikes}
          onCommentsClick={handleStatsComments}
          onSharesClick={handleStatsShares}
          onBookmarksClick={handleStatsBookmarks}
        />
      </ErrorBoundary>

      <ErrorBoundary
        fallback={
          <View className="text-red-400 p-4">
            <Text>❌ Erreur dans CommunityActions</Text>
          </View>
        }
      >
        <CommunityActions
          onLike={handleLike}
          onComment={() => setShowComments(!showComments)}
          onShare={handleShare}
          onBookmark={handleBookmark}
          onReport={handleReport}
          onReaction={handleReaction}
          isLiked={post.likedByMe}
          isBookmarked={post.bookmarkedByMe}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          shareCount={post.shareCount || 0}
          reactions={reactions}
          userReaction={userReaction || undefined}
        />
      </ErrorBoundary>

      {showComments && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4">
              <Text>❌ Erreur dans CommunityComments</Text>
            </View>
          }
        >
          <CommunityComments
            postId={post._id}
            comments={comments || []}
            onAddComment={handleComment}
            onReply={handleReply}
            onLikeComment={handleLikeComment}
            onAuthorClick={handleAuthorClick}
          />
        </ErrorBoundary>
      )}

      <View className="flex items-center justify-between pt-4 border-t border-white/10">
        <Pressable onPress={handleLike} style={styles.footerAction}>
          <Heart
            size={18}
            color={post.likedByMe ? "#EF4444" : "rgba(255,255,255,0.6)"}
            fill={post.likedByMe ? "#EF4444" : "transparent"}
          />
          <Text style={styles.footerActionText}>{post.likeCount}</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowComments(!showComments)}
          style={styles.footerAction}
        >
          <MessageCircle size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.footerActionText}>{post.commentCount}</Text>
        </Pressable>
        <Pressable onPress={handleShare} style={styles.footerAction}>
          <Share2 size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Pressable onPress={handleBookmark} style={styles.footerAction}>
          <Bookmark
            size={18}
            color={post.bookmarkedByMe ? "#A78BFA" : "rgba(255,255,255,0.6)"}
            fill={post.bookmarkedByMe ? "#A78BFA" : "transparent"}
          />
        </Pressable>
      </View>
    </View>
  );

  // ── Rendu principal ─────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 relative">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1 truncate">
          Publication
        </Text>
        <Pressable
          onPress={() => setShowMenu(!showMenu)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <MoreVertical size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Pressable
          onPress={() => setDebugMode(true)}
          className="text-[10px] text-white/20 px-2 py-1"
        >
          <Text style={styles.debugLink}>debug</Text>
        </Pressable>

        {showMenu && (
          <View className="absolute right-4 top-16 z-50 w-48 rounded-xl bg-zinc-900/95 border border-white/10 shadow-xl overflow-hidden">
            <View className="py-1">
              <Pressable
                onPress={handleEdit}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                <Pencil size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.menuText}>Modifier</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400"
              >
                <Trash2 size={16} color="#F87171" />
                <Text style={[styles.menuText, { color: "#F87171" }]}>
                  Supprimer
                </Text>
              </Pressable>
              {/* ✅ <hr> remplacé par une View avec bordure */}
              <View style={styles.divider} />
              <Pressable
                onPress={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                {/* ✅ LinkIcon (alias de Link lucide) pour éviter tout conflit */}
                <LinkIcon size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.menuText}>Copier le lien</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  handleReport();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                <Flag size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.menuText}>Signaler</Text>
              </Pressable>
              <Pressable
                onPress={handleHide}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                <EyeOff size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.menuText}>Masquer</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setShowMenu(false)}
              className="absolute top-2 right-2"
            >
              <X size={16} color="rgba(255,255,255,0.3)" />
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-6 text-center bg-red-500/10 rounded-2xl border border-red-500/20">
              <Text className="font-bold text-lg">
                ❌ Erreur dans l'affichage du post
              </Text>
              <Text className="text-sm text-red-300/70 mt-2">
                Un composant a planté. Utilisez le bouton "debug" en haut à
                droite pour voir les données brutes.
              </Text>
            </View>
          }
        >
          {renderContent()}
        </ErrorBoundary>
      </ScrollView>

      {showShare && (
        <CommunityShare
          title={post.title || "Post"}
          description={post.description}
          url={shareUrl}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* ✅ Modal de signalement — utilise <Modal> au lieu de `fixed inset-0` */}
      <Modal
        visible={showReport}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReport(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Signaler ce post</Text>
            <Text style={styles.modalSubtitle}>
              Pourquoi signalez-vous ce contenu ?
            </Text>
            <View style={styles.modalOptions}>
              {[
                "Spam",
                "Contenu inapproprié",
                "Harcèlement",
                "Fausse information",
                "Autre",
              ].map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => {
                    void reportContent({ postId: post._id, reason });
                    setShowReport(false);
                  }}
                  style={styles.modalOption}
                >
                  <Text style={styles.modalOptionText}>{reason}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowReport(false)}
              style={styles.modalCancel}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {showBoost && (
        <CommunityBoost
          onBoost={async (duration) => {
            UIService.openToast(
              `Post boosté pour ${duration} jours !`,
              "success",
            );
            setShowBoost(false);
          }}
          onClose={() => setShowBoost(false)}
        />
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 20,
  },
  inlineText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  footerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerActionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  menuText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  debugLink: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 4,
  },

  // Debug screen
  debugScreen: {
    flex: 1,
    padding: 24,
    backgroundColor: "#000000",
  },
  debugTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  debugScroll: {
    maxHeight: "70%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  debugScrollContent: {
    padding: 16,
  },
  debugPre: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  debugButton: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(168,85,247,0.2)",
    alignSelf: "flex-start",
  },
  debugButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },

  // Modal de signalement
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#18181B",
    padding: 24,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginBottom: 16,
  },
  modalOptions: {
    gap: 8,
  },
  modalOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  modalOptionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  modalCancel: {
    marginTop: 16,
    alignSelf: "center",
  },
  modalCancelText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
});
