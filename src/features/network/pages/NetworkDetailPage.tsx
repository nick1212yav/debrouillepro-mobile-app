import { View, Text, Pressable, TextInput, Image, Share, NativeSyntheticEvent } from "react-native";

// src/features/network/pages/NetworkDetailPage.tsx

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  Calendar,
  MapPin,
  Send,
  Loader2,
  MoreHorizontal,
  Clock,
} from "lucide-react-native";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { formatTime } from "@/features/publications/utils/format.utils";
import { NetworkAvatar } from "../components/common/NetworkAvatar";
import { cn } from "@/lib/utils";
import { Clipboard } from "@react-native-clipboard/clipboard";

// ─── Types ─────────────────────────────────────────────────────────────────────

// ✅ likeCount peut être undefined car le champ est optionnel dans le schéma
interface Comment {
  _id: Id<"comments">;
  _creationTime: number;
  authorId: Id<"users">;
  publicationId: Id<"publications">;
  text: string;
  parentId?: Id<"comments">;
  likeCount?: number; // ✅ optionnel
  authorName?: string;
  authorAvatar?: string;
  likedByMe?: boolean;
}

// ─── Composant d'affichage d'un commentaire ──────────────────────────────────

function CommentItem({
  comment,
  onLike,
}: {
  comment: Comment;
  onLike: (commentId: Id<"comments">) => void;
}) {
  const [liked, setLiked] = useState(comment.likedByMe || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0); // ✅ fallback 0

  const handleLike = () => {
    onLike(comment._id);
    // Optimistic update
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <View className="flex gap-3 py-3 border-b border-white/5 last:border-0"><NetworkAvatar avatar={comment.authorAvatar} name={comment.authorName || "Utilisateur"} size={36} verified={false} /><View className="flex-1 min-w-0"><View className="flex items-center gap-2 flex-wrap"><Text className="text-white font-semibold text-sm">{comment.authorName || "Utilisateur"}</Text><Text className="text-white/30 text-xs flex items-center gap-1"><Clock size={10} />{formatTime(comment._creationTime)}</Text></View><Text className="text-white/80 text-sm leading-relaxed mt-0.5">{comment.text}</Text><View className="flex items-center gap-3 mt-1.5"><Pressable onPress={handleLike} className="flex items-center gap-1 text-xs text-white/40 transition"><Heart size={13} className={liked ? "fill-red-400 text-red-400" : ""} />{likeCount > 0 && <Text>{likeCount}</Text>}</Pressable><Pressable className="text-xs text-white/40 transition"><Text>Répondre</Text></Pressable></View></View></View>
  );
}

// ─── Composant de la section commentaires ────────────────────────────────────

function NetworkCommentSection({
  publicationId,
  commentCount,
}: {
  publicationId: Id<"publications">;
  commentCount: number;
}) {
  const { user: firebaseUser } = useFirebaseAuth();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const inputRef = useRef<TextInput>(null);

  // ── Requêtes et mutations ──
  const comments = useQuery(api.comments.listComments, {
    publicationId,
    limit: 50,
  });
  const createComment = useMutation(api.comments.createComment);
  const likeComment = useMutation(api.comments.likeComment);

  const isLoading = comments === undefined;

  const handleSubmit = async (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast.error("Connectez-vous pour commenter");
      return;
    }
    const text = newComment.trim();
    if (!text) return;

    setIsSubmitting(true);
    try {
      await createComment({
        publicationId,
        text,
        parentId: undefined,
      });
      setNewComment("");
      setLocalCommentCount((prev) => prev + 1);
      toast.success("Commentaire ajouté");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: Id<"comments">) => {
    if (!firebaseUser) {
      toast.error("Connectez-vous pour liker");
      return;
    }
    try {
      await likeComment({ commentId });
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du like");
    }
  };

  return (
    <View className="mt-6"><View className="flex items-center gap-2 mb-4"><MessageCircle size={18} className="text-white/40" /><Text className="text-white font-semibold text-sm">Commentaires ({localCommentCount})
        </Text></View>{}{firebaseUser && (
        <View className="flex gap-2 mb-4"><TextInput ref={inputRef} value={newComment} onChangeText={(value) => setNewComment(value)} placeholder="Écrire un commentaire..." className="flex-1 rounded-2xl px-4 py-2 text-sm text-white placeholder:text-white/30 bg-white/5 border border-white/10 focus:border-white/20 transition outline-none" multiline textAlignVertical="top" /><Pressable disabled={isSubmitting || !newComment.trim()} className="flex-shrink-0 w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 transition disabled:opacity-40">{isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}</Pressable></View>
      )}{}{isLoading ? (
        <View className="space-y-3"><Skeleton className="h-14 w-full rounded-2xl" /><Skeleton className="h-14 w-full rounded-2xl" /><Skeleton className="h-14 w-full rounded-2xl" /></View>
      ) : comments && comments.length > 0 ? (
        <View className="space-y-1">{comments.map((c) => (
            <CommentItem key={c._id} comment={c} onLike={handleLike} />
          ))}</View>
      ) : (
        <View className="text-center py-8 text-white/30 text-sm"><Text>Aucun commentaire pour l'instant. Soyez le premier à réagir !</Text></View>
      )}</View>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

interface NetworkDetailPageProps {
  publicationId: Id<"publications">;
  onBack: () => void;
  onNavigate?: (page: string, params?: any) => void;
  onMessage?: (userId: Id<"users">) => void;
}

export default function NetworkDetailPage({
  publicationId,
  onBack,
  onNavigate,
  onMessage,
}: NetworkDetailPageProps) {
  const navigate = useNavigate();
  const { user: firebaseUser } = useFirebaseAuth();
  const [isLiking, setIsLiking] = useState(false);

  // ── Données ──
  const post = useQuery(api.network.getPost, { publicationId });
  const isLoading = post === undefined;

  // ── Mutations ──
  const likePublication = useMutation(api.publications.likePublication);

  // ── Gestionnaires ──
  const handleLike = async () => {
    if (!firebaseUser || isLiking || !post) return;
    setIsLiking(true);
    try {
      await likePublication({ publicationId });
      toast.success("Like mis à jour");
    } catch (error) {
      toast.error("Impossible de liker ce post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      Share.share({ message: String(post?.description || "") + "\n" + "\n" + String(window.location.href), title: post?.title || "Post réseau" })
        .catch(() => {});
    } else {
      Clipboard.setString(window.location.href)
        .then(() => toast.success("Lien copié"))
        .catch(() => toast.info("Partagez ce post"));
    }
  };

  const scrollToComments = () => {
    const el = document.getElementById("comments-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // ── États de chargement ──
  if (isLoading) {
    return (
      <View className="h-full overflow-y-auto bg-gradient-to-b from-[#020617] to-[#0a0a1a] px-4 pt-12"><Skeleton className="h-10 w-10 rounded-2xl mb-6" /><Skeleton className="h-64 w-full rounded-3xl mb-4" /><Skeleton className="h-8 w-48 rounded-xl mb-4" /><Skeleton className="h-24 w-full rounded-2xl" /><View className="flex gap-4 mt-4"><Skeleton className="h-10 w-16 rounded-xl" /><Skeleton className="h-10 w-16 rounded-xl" /></View></View>
    );
  }

  if (!post) {
    return (
      <View className="h-full flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-[#020617] to-[#0a0a1a]"><View className="text-5xl mb-4"><Text>🔍</Text></View><Text className="text-white font-bold text-xl">Post introuvable</Text><Text className="text-white/40 text-sm mt-2">Ce post réseau n'existe pas ou a été supprimé.
        </Text><Pressable onPress={onBack} className="mt-5 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"><Text>Retour</Text></Pressable></View>
    );
  }

  const author = post.author;
  const images = post.images || [];
  const likeCount = post.likeCount || 0;
  const commentCount = post.commentCount || 0;
  const viewCount = post.viewCount || 0;
  const createdAt = post._creationTime;
  const likedByMe = post.likedByMe || false;

  return (
    <View className="h-full overflow-y-auto bg-gradient-to-b from-[#020617] to-[#0a0a1a]" style={{  }}>{}<View className="sticky top-0 z-30 flex items-center justify-between px-4 pt-10 pb-3 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/8 transition"><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex items-center gap-2"><Pressable onPress={handleShare} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/8 transition"><Share2 size={16} className="text-white" /></Pressable></View></View><View className="px-4 pb-8">{}<View className="flex items-center gap-3 mt-4"><NetworkAvatar avatar={author?.avatar} name={author?.name || "Utilisateur"} size={48} verified={false} /><View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white font-semibold text-sm truncate">{author?.name || "Utilisateur inconnu"}</Text>{author?.roles?.includes("verified_seller") && (
                <Text className="text-emerald-400 text-xs font-medium">✓</Text>
              )}</View>{author?.headline && (
              <Text className="text-white/40 text-xs truncate">{author.headline}</Text>
            )}<View className="flex items-center gap-2 text-white/30 text-[10px] mt-0.5"><Calendar size={10} /><Text>{formatTime(createdAt)}</Text><Text className="w-1 h-1 rounded-full bg-white/20" /><Eye size={10} /><Text>{viewCount}vues</Text></View></View>{author?._id && (
            <Pressable onPress={() => navigate(`/network/profile/${author._id}`)} className="text-xs font-medium text-indigo-400 transition"><Text>Voir profil</Text></Pressable>
          )}</View>{}<View className="mt-4 space-y-3">{post.title && (
            <Text className="text-white text-xl font-bold leading-tight">{post.title}</Text>
          )}{post.description && (
            <Text className="text-white/70 text-sm leading-relaxed">{post.description}</Text>
          )}</View>{}{images.length > 0 && (
          <View className="mt-4 rounded-3xl overflow-hidden bg-white/5 border border-white/10">{images.length === 1 ? (
              <Image className="w-full h-auto max-h-[500px] object-contain" source={{ uri: images[0] }} accessibilityLabel={post.title || "Image du post"} />
            ) : (
              <View className="gap-0.5">{images.slice(0, 4).map((url, idx) => (
                  <View key={idx} className="aspect-square overflow-hidden"><Image className="w-full h-full object-cover" source={{ uri: url }} accessibilityLabel={`Image ${idx + 1}`} /></View>
                ))}{images.length > 4 && (
                  <View className="aspect-square bg-white/5 flex items-center justify-center text-white/60 text-sm font-medium border border-white/5"><Text>+</Text>{images.length - 4}</View>
                )}</View>
            )}</View>
        )}{}<View className="flex items-center gap-4 mt-4 text-white/40 text-xs"><Text className="flex items-center gap-1"><Heart size={12} className="text-red-400 fill-red-400/30" />{likeCount}</Text><Text className="flex items-center gap-1"><MessageCircle size={12} />{commentCount}</Text><Text className="flex items-center gap-1"><Eye size={12} />{viewCount}</Text></View>{}<View className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5"><Pressable onPress={handleLike} disabled={isLiking} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white/80 transition disabled:opacity-50"><Heart size={16} className={likedByMe ? "fill-red-400 text-red-400" : ""} />{likedByMe ? "Vous aimez" : "Aimer"}</Pressable><Pressable onPress={scrollToComments} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/10 text-white/80 transition"><MessageCircle size={16} /><Text>Commenter</Text></Pressable>{onMessage && author?._id && (
            <Pressable onPress={() => onMessage(author._id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition"><MessageCircle size={16} /><Text>Contacter</Text></Pressable>
          )}</View>{}<View id="comments-section" className="pt-2"><NetworkCommentSection publicationId={publicationId} commentCount={commentCount} /></View></View></View>
  );
}
