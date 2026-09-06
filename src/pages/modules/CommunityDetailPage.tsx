import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";

function NativeConfirmAlert(message: string): boolean {
  Alert.alert(message, "Confirmation", [
    { text: "Annuler", style: "cancel" },
    { text: "Confirmer", onPress: () => undefined },
  ]);
  return false;
}
import { View, Text, Pressable, Alert } from "react-native";

// src/pages/modules/CommunityDetailPage.tsx
import { useState, useEffect, Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
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
  Link,
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

// ── ErrorBoundary ──────────────────────────────────────────────────────────
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

// ── Composants désactivés (placeholders) ──────────────────────────────────
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

  // États pour les réactions (exemple)
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
    console.log("🔍 publication =", publication);
    if (publication === undefined) {
      setLoading(true);
      return;
    }
    if (publication) {
      try {
        const adapted = adaptCommunityPost(publication);
        console.log("✅ adapted =", adapted);
        console.log("POST IMAGES =", adapted.images);
        console.log("META IMAGES =", adapted.meta?.images);
        setPost(adapted);
        setLoading(false);
        trackView({ publicationId: publication._id }).catch((err) =>
          console.warn("⚠️ trackView error:", err),
        );
        // Simuler des réactions (à remplacer par des données réelles)
        setReactions({ "❤️": adapted.likeCount || 0 });
        setUserReaction(adapted.likedByMe ? "❤️" : null);
      } catch (err) {
        console.error("❌ Erreur dans adaptCommunityPost :", err);
        setPost(null);
        setLoading(false);
      }
    } else {
      console.log("⚠️ publication = null");
      setPost(null);
      setLoading(false);
    }
  }, [publication, trackView]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLike = async () => {
    if (!post) return;
    try {
      await likePost({ publicationId: post._id });
      setPost({
        ...post,
        likedByMe: !post.likedByMe,
        likeCount: post.likedByMe ? post.likeCount - 1 : post.likeCount + 1,
      });
    } catch (error) {
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
      UIService.openToast(post.bookmarkedByMe ? "Retiré des favoris" : "Ajouté aux favoris", "success");
    } catch (error) {
      UIService.openToast("Erreur lors de l'enregistrement", "error");
    }
  };

  const handleShare = () => setShowShare(true);
  const handleReport = () => setShowReport(true);
  const handleBoost = () => setShowBoost(true);

  const handleDelete = async () => {
    if (!post) return;
    if (!NativeConfirmAlert("Voulez-vous vraiment supprimer ce post ?")) return;
    try {
      await deletePost({ publicationId: post._id });
      UIService.openToast("Post supprimé", "success");
      router(-1);
    } catch (error) {
      UIService.openToast("Erreur lors de la suppression", "error");
    }
  };

  const handleCopyLink = () => {
    undefined.writeText(undefined.href);
    UIService.openToast("Lien copié !", "success");
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
    } catch (error) {
      UIService.openToast("Erreur lors de l'ajout du commentaire", "error");
    }
  };

  const handleReply = async (text: string, parentId: string) => {
    try {
      await addReply(text, parentId as Id<"comments">);
      UIService.openToast("Réponse ajoutée", "success");
    } catch (error) {
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
    } catch (error) {
      UIService.openToast("Erreur lors du signalement", "error");
    }
  };

  const handleStatsLikes = () => UIService.openToast("Liste des likes à venir", "info");
  const handleStatsComments = () => setShowComments(!showComments);
  const handleStatsShares = () => setShowShare(true);
  const handleStatsBookmarks = () => UIService.openToast("Liste des favoris à venir", "info");

  const handleVote = async (optionId: string) => {
    if (!post) return;
    try {
      await votePoll({ publicationId: post._id, optionId });
      UIService.openToast("Vote enregistré !", "success");
    } catch (error) {
      UIService.openToast("Erreur lors du vote", "error");
    }
  };

  const handleAnswer = async (answer: string) => {
    UIService.openToast("Réponse aux questions bientôt disponible", "info");
  };

  const handleLikeComment = async (commentId: string) => {
    UIService.openToast("Like des commentaires bientôt disponible", "info");
  };

  const handleAuthorClick = (authorId: string) => {
    router.push(`/profile/${authorId}`);
  };

  // ── Handler pour les réactions multiples ──────────────────────────────
  const handleReaction = (emoji: string) => {
    if (!post) return;
    if (emoji === userReaction) {
      // Retirer la réaction
      setUserReaction(null);
      setReactions((prev) => {
        const newReactions = { ...prev };
        if (newReactions[emoji] && newReactions[emoji] > 0) {
          newReactions[emoji] -= 1;
          if (newReactions[emoji] === 0) delete newReactions[emoji];
        }
        return newReactions;
      });
      // Appeler le like standard pour décrémenter (ou une mutation dédiée)
      handleLike();
    } else {
      // Ajouter ou changer la réaction
      setUserReaction(emoji);
      setReactions((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1,
      }));
      // Mettre à jour le like si pas déjà liké
      if (!post.likedByMe) {
        handleLike();
      }
      UIService.openToast(`Réaction ${emoji} ajoutée`, "success");
      // Ici, appeler une mutation Convex pour stocker la réaction
    }
  };

  // ── Handler pour le suivi ──────────────────────────────────────────────
  const handleFollow = () => {
    setIsFollowing(true);
    UIService.openToast("Vous suivez maintenant cet auteur", "success");
  };

  const handleUnfollow = () => {
    setIsFollowing(false);
    UIService.openToast("Vous ne suivez plus cet auteur", "info");
  };

  // ── États de chargement et d'erreur ─────────────────────────────────────

  if (loading) {
    return (
      <View
        className="h-full flex flex-col"
        style={{  }}
      >
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

  if (!post) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center"
        style={{  }}
      >
        <Pressable onPress={() => router(-1)} className="self-start ml-4 mb-4">
          <ArrowLeft size={24} className="text-white/60" />
        </Pressable>
        <Text className="text-white/40">Post introuvable</Text>
      </View>
    );
  }

  // ── Mode debug ──────────────────────────────────────────────────────────
  if (debugMode) {
    return (
      <View className="p-6 text-white min-h-screen bg-black">
        <Text className="text-xl font-bold mb-4">🔍 Données du post (debug)</Text>
        <pre className="text-xs bg-white/10 p-4 rounded-xl overflow-auto max-h-[80vh] border border-white/10">
          {JSON.stringify(post, null, 2)}
        </pre>
        <Pressable
          onPress={() => setDebugMode(false)}
          className="mt-6 px-4 py-2 bg-purple-500/20 rounded-xl"
        >
          <Text>Retour au rendu normal</Text></Pressable>
        <Pressable
          onPress={() => router(-1)}
          className="mt-6 ml-4 px-4 py-2 bg-white/10 rounded-xl"
        >
          <Text>← Retour</Text></Pressable>
      </View>
    );
  }

  // ── Sécurisation de `post.meta` ──────────────────────────────────────────
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

  // ── Rendu principal ─────────────────────────────────────────────────────

  const renderContent = () => (
    <View
      className="space-y-4"
    >
      <ErrorBoundary
        fallback={
          <View className="text-red-400 p-4"><Text>❌ Erreur dans CommunityHeader</Text></View>
        }
      >
        <CommunityHeader
          authorId={post.authorId}
          authorName={post.authorName || "Anonyme"}
          authorAvatar={post.authorAvatar}
          createdAt={post._creationTime}
          isVerified={false} // à remplacer par une vraie valeur
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
              <Text>❌ Erreur dans CommunityGallery</Text></View>
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
              <Text>❌ Erreur dans CommunityHashtags</Text></View>
          }
        >
          <CommunityHashtags tags={post.tags} />
        </ErrorBoundary>
      )}

      {safeMeta.location && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4">
              <Text>❌ Erreur dans CommunityLocation</Text></View>
          }
        >
          <CommunityLocation location={safeMeta.location} />
        </ErrorBoundary>
      )}
      {safeMeta.latitude && safeMeta.longitude && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4"><Text>❌ Erreur dans CommunityMap</Text></View>
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
          <Calendar size={16} className="text-purple-400" />
          <Text>{new Date(safeMeta.eventDate).toLocaleDateString()}</Text>
          {safeMeta.eventLocation && (
            <>
              <Text className="text-white/20">|</Text>
              <MapPin size={16} className="text-purple-400" />
              <Text>{safeMeta.eventLocation}</Text>
            </>
          )}
        </View>
      )}

      {post.type === "poll" && safeMeta.pollOptions.length > 0 && (
        <ErrorBoundary
          fallback={
            <View className="text-red-400 p-4"><Text>❌ Erreur dans CommunityPoll</Text></View>
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
              <Text>❌ Erreur dans CommunityQuestion</Text></View>
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
            <Text>❌ Erreur dans CommunityStatistics</Text></View>
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
            <Text>❌ Erreur dans CommunityActions</Text></View>
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
              <Text>❌ Erreur dans CommunityComments</Text></View>
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
        <Pressable
          onPress={handleLike}
          className="flex items-center gap-2 text-white/60"
        >
          <Heart
            size={18}
            className={post.likedByMe ? "fill-red-500 text-red-500" : ""}
          />
          <Text>{post.likeCount}</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-white/60"
        >
          <MessageCircle size={18} />
          <Text>{post.commentCount}</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          className="flex items-center gap-2 text-white/60"
        >
          <Share2 size={18} />
        </Pressable>
        <Pressable
          onPress={handleBookmark}
          className="flex items-center gap-2 text-white/60"
        >
          <Bookmark
            size={18}
            className={
              post.bookmarkedByMe ? "fill-purple-400 text-purple-400" : ""
            }
          />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 relative">
        <Pressable
          onPress={() => router(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1 truncate">
          Publication
        </Text>
        <Pressable
          onPress={() => setShowMenu(!showMenu)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <MoreVertical size={20} className="text-white/60" />
        </Pressable>
        <Pressable
          onPress={() => setDebugMode(true)}
          className="text-[10px] text-white/20 px-2 py-1"
        >
          <Text>debug</Text></Pressable>

        {showMenu && (
          <View className="absolute right-4 top-16 z-50 w-48 rounded-xl bg-zinc-900/95 border border-white/10 shadow-xl overflow-hidden">
            <View className="py-1">
              <Pressable
                onPress={handleEdit}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                <Pencil size={16} />
                <Text>Modifier</Text></Pressable>
              <Pressable
                onPress={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400"
              >
                <Trash2 size={16} />
                <Text>Supprimer</Text></Pressable>
              <hr className="border-white/5" />
              <Pressable
                onPress={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                <Link size={16} />
                <Text>Copier le lien</Text></Pressable>
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  handleReport();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                <Flag size={16} />
                <Text>Signaler</Text></Pressable>
              <Pressable
                onPress={handleHide}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                <EyeOff size={16} />
                <Text>Masquer</Text></Pressable>
            </View>
            <Pressable
              onPress={() => setShowMenu(false)}
              className="absolute top-2 right-2 text-white/30"
            >
              <X size={16} />
            </Pressable>
          </View>
        )}
      </View>

      <View
        className="flex-1 overflow-y-auto px-4 pb-8 space-y-5"
        style={{  }}
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
      </View>

      {showShare && (
        <CommunityShare
          title={post.title || "Post"}
          description={post.description}
          url={undefined.href}
          onClose={() => setShowShare(false)}
        />
      )}

      {showReport && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <View className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full border border-white/10">
            <Text className="text-white font-bold text-lg mb-2">
              Signaler ce post
            </Text>
            <Text className="text-white/60 text-sm mb-4">
              Pourquoi signalez-vous ce contenu ?
            </Text>
            <View className="space-y-2">
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
                    reportContent({ postId: post._id, reason });
                    setShowReport(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-xl text-white/80"
                >
                  {reason}
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowReport(false)}
              className="mt-4 text-white/40 text-sm"
            >
              <Text>Annuler</Text></Pressable>
          </View>
        </View>
      )}

      {showBoost && (
        <CommunityBoost
          onBoost={async (duration) => {
            UIService.openToast(`Post boosté pour ${duration} jours !`, "success");
            setShowBoost(false);
          }}
          onClose={() => setShowBoost(false)}
        />
      )}
    </View>
  );
}
