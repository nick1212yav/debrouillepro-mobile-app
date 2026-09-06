// src/features/network/pages/NetworkDetailPage.tsx

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Send,
  Share2,
} from "lucide-react-native";

import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { formatTime } from "@/features/publications/utils/format.utils";

import { NetworkAvatar } from "../components/common/NetworkAvatar";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Comment {
  _id: Id<"comments">;
  _creationTime: number;
  authorId: Id<"users">;
  publicationId: Id<"publications">;
  text: string;
  parentId?: Id<"comments">;
  likeCount?: number;
  authorName?: string;
  authorAvatar?: string;
  likedByMe?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Comment item
// ─────────────────────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  onLike,
}: {
  comment: Comment;
  onLike: (commentId: Id<"comments">) => Promise<void>;
}) {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) {
      return;
    }

    setIsLiking(true);

    try {
      await onLike(comment._id);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="flex gap-3 border-b border-white/5 py-3 last:border-0">
      <NetworkAvatar
        avatar={comment.authorAvatar}
        name={comment.authorName || "Utilisateur"}
        size={36}
        verified={false}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white">
            {comment.authorName || "Utilisateur"}
          </span>

          <span className="flex items-center gap-1 text-xs text-white/30">
            <Clock size={10} />
            {formatTime(comment._creationTime)}
          </span>
        </div>

        <p className="mt-0.5 text-sm leading-relaxed text-white/80">
          {comment.text}
        </p>

        <div className="mt-1.5 flex items-center gap-3">
          <button
            onPress={() => {
              void handleLike();
            }}
            disabled={isLiking}
            className="flex items-center gap-1 text-xs text-white/40 transition hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Heart
              size={13}
              className={
                comment.likedByMe
                  ? "fill-red-400 text-red-400"
                  : "text-white/40"
              }
            />

            {(comment.likeCount ?? 0) > 0 && (
              <span>{comment.likeCount ?? 0}</span>
            )}
          </button>

          <button
            className="text-xs text-white/40 transition hover:text-white/70"
          >
            Répondre
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Comments section
// ─────────────────────────────────────────────────────────────────────────────

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

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const comments = useQuery(api.comments.listComments, {
    publicationId,
    limit: 50,
  });

  const createComment = useMutation(api.comments.createComment);
  const likeComment = useMutation(api.comments.likeComment);

  const isLoading = comments === undefined;

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!firebaseUser) {
      toast.error("Connectez-vous pour commenter");
      return;
    }

    const text = newComment.trim();

    if (!text || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createComment({
        publicationId,
        text,
        parentId: undefined,
      });

      setNewComment("");
      setLocalCommentCount((previous) => previous + 1);

      toast.success("Commentaire ajouté");

      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: Id<"comments">): Promise<void> => {
    if (!firebaseUser) {
      toast.error("Connectez-vous pour liker");
      return;
    }

    try {
      await likeComment({ commentId });
    } catch (error) {
      console.error("Erreur lors du like du commentaire:", error);
      toast.error("Erreur lors du like");
    }
  };

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle size={18} className="text-white/40" />

        <h3 className="text-sm font-semibold text-white">
          Commentaires ({localCommentCount})
        </h3>
      </div>

      {firebaseUser ? (
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <textarea
            ref={inputRef}
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Écrire un commentaire..."
            rows={2}
            disabled={isSubmitting}
            className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <button
            disabled={isSubmitting || !newComment.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20 text-indigo-300 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Envoyer le commentaire"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      ) : (
        <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center text-xs text-white/35">
          Connectez-vous pour participer à la discussion.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onLike={handleLike}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-white/30">
          Aucun commentaire pour l'instant. Soyez le premier à réagir !
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface NetworkDetailPageProps {
  publicationId: Id<"publications">;
  onBack: () => void;
  onNavigate?: (page: string, params?: Record<string, unknown>) => void;
  onMessage?: (userId: Id<"users">) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function NetworkDetailPage({
  publicationId,
  onBack,
  onNavigate,
  onMessage,
}: NetworkDetailPageProps) {
  const navigate = useNavigate();
  const { user: firebaseUser } = useFirebaseAuth();

  const [isLiking, setIsLiking] = useState(false);

  const post = useQuery(api.network.getPost, {
    publicationId,
  });

  const likePublication = useMutation(api.publications.likePublication);

  const isLoading = post === undefined;

  const handleLike = async (): Promise<void> => {
    if (!firebaseUser) {
      toast.error("Connectez-vous pour aimer ce post");
      return;
    }

    if (!post || isLiking) {
      return;
    }

    setIsLiking(true);

    try {
      await likePublication({
        publicationId,
      });
    } catch (error) {
      console.error("Erreur lors du like:", error);
      toast.error("Impossible de mettre à jour votre like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (): Promise<void> => {
    if (!post) {
      return;
    }

    const shareUrl =
      typeof window !== "undefined" ? window.location.href : undefined;

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title: post.title || "Post réseau",
          text: post.description || "",
          url: shareUrl,
        });

        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);

        toast.success("Lien copié");
        return;
      }

      toast.info("Partage indisponible sur cet appareil");
    } catch (error) {
      const shareError = error as Error;

      if (shareError?.name !== "AbortError") {
        console.error("Erreur lors du partage:", error);
        toast.error("Impossible de partager ce post");
      }
    }
  };

  const scrollToComments = (): void => {
    if (typeof document === "undefined") {
      return;
    }

    document.getElementById("comments-section")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleProfileNavigation = (): void => {
    if (!post?.author?._id) {
      return;
    }

    if (onNavigate) {
      onNavigate("network-profile", {
        userId: post.author._id,
      });

      return;
    }

    navigate(`/network/profile/${post.author._id}`);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-b from-[#020617] to-[#0a0a1a] px-4 pt-12">
        <Skeleton className="mb-6 h-10 w-10 rounded-2xl" />
        <Skeleton className="mb-4 h-64 w-full rounded-3xl" />
        <Skeleton className="mb-4 h-8 w-48 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />

        <div className="mt-4 flex gap-4">
          <Skeleton className="h-10 w-16 rounded-xl" />
          <Skeleton className="h-10 w-16 rounded-xl" />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Not found
  // ───────────────────────────────────────────────────────────────────────────

  if (!post) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#020617] to-[#0a0a1a] px-6 text-center">
        <div className="mb-4 text-5xl">🔍</div>

        <h2 className="text-xl font-bold text-white">Post introuvable</h2>

        <p className="mt-2 text-sm text-white/40">
          Ce post réseau n'existe pas ou a été supprimé.
        </p>

        <button
          onPress={onBack}
          className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15"
        >
          Retour
        </button>
      </div>
    );
  }

  const author = post.author;
  const images = post.images ?? [];

  const likeCount = post.likeCount ?? 0;
  const commentCount = post.commentCount ?? 0;
  const viewCount = post.viewCount ?? 0;

  const createdAt = post._creationTime;
  const likedByMe = post.likedByMe ?? false;

  return (
    <div
      className="h-full overflow-y-auto bg-gradient-to-b from-[#020617] to-[#0a0a1a]"
      style={{
        scrollbarWidth: "none",
      }}
    >
      {/* Header */}

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 px-4 pb-3 pt-10 backdrop-blur-xl">
        <button
          onPress={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/8 transition hover:bg-white/15"
          aria-label="Retour"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>

        <button
          onPress={() => {
            void handleShare();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/8 transition hover:bg-white/15"
          aria-label="Partager"
        >
          <Share2 size={16} className="text-white" />
        </button>
      </header>

      <main className="px-4 pb-8">
        {/* Author */}

        <section className="mt-4 flex items-center gap-3">
          <NetworkAvatar
            avatar={author?.avatar}
            name={author?.name || "Utilisateur"}
            size={48}
            verified={false}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-white">
                {author?.name || "Utilisateur inconnu"}
              </span>

              {author?.roles?.includes("verified_seller") && (
                <span className="text-xs font-medium text-emerald-400">✓</span>
              )}
            </div>

            {author?.headline && (
              <p className="truncate text-xs text-white/40">
                {author.headline}
              </p>
            )}

            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-white/30">
              <Calendar size={10} />

              <span>{formatTime(createdAt)}</span>

              <span className="h-1 w-1 rounded-full bg-white/20" />

              <Eye size={10} />

              <span>{viewCount} vues</span>
            </div>
          </div>

          {author?._id && (
            <button
              onPress={handleProfileNavigation}
              className="whitespace-nowrap text-xs font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              Voir profil
            </button>
          )}
        </section>

        {/* Content */}

        <section className="mt-4 space-y-3">
          {post.title && (
            <h1 className="text-xl font-bold leading-tight text-white">
              {post.title}
            </h1>
          )}

          {post.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-white/70">
              {post.description}
            </p>
          )}
        </section>

        {/* Images */}

        {images.length > 0 && (
          <section className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {images.length === 1 ? (
              <img
                src={images[0]}
                alt={post.title || "Image du post"}
                className="max-h-[500px] w-full object-contain"
              />
            ) : (
              <div className="grid grid-cols-2 gap-0.5">
                {images.slice(0, 4).map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="relative aspect-square overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    {index === 3 && images.length > 4 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-semibold text-white backdrop-blur-[1px]">
                        +{images.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Statistics */}

        <section className="mt-4 flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <Heart size={12} className="fill-red-400/30 text-red-400" />

            {likeCount}
          </span>

          <span className="flex items-center gap-1">
            <MessageCircle size={12} />

            {commentCount}
          </span>

          <span className="flex items-center gap-1">
            <Eye size={12} />

            {viewCount}
          </span>
        </section>

        {/* Actions */}

        <section className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
          <button
            onPress={() => {
              void handleLike();
            }}
            disabled={isLiking}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-2 text-white/80 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLiking ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Heart
                size={16}
                className={likedByMe ? "fill-red-400 text-red-400" : undefined}
              />
            )}

            {likedByMe ? "Vous aimez" : "Aimer"}
          </button>

          <button
            onPress={scrollToComments}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/8 px-4 py-2 text-white/80 transition hover:bg-white/15"
          >
            <MessageCircle size={16} />
            Commenter
          </button>

          {onMessage && author?._id && (
            <button
              onPress={() => onMessage(author._id)}
              className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/20 px-4 py-2 text-indigo-300 transition hover:bg-indigo-500/30"
            >
              <MessageCircle size={16} />
              Contacter
            </button>
          )}
        </section>

        {/* Comments */}

        <div id="comments-section" className="pt-2">
          <NetworkCommentSection
            publicationId={publicationId}
            commentCount={commentCount}
          />
        </div>
      </main>
    </div>
  );
}
