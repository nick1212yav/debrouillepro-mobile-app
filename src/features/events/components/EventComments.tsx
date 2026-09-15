import { View, Text, Pressable, Image, TextInput } from "react-native";

// src/features/events/components/EventComments.tsx
import { useState, useRef, useEffect } from "react";
import { User, Heart, Send, X } from "lucide-react-native";
import { toast } from "sonner";
import type { EventComment } from "../types";

interface Props {
  comments: EventComment[];
  onAddComment: (text: string) => Promise<void>;
  onReply: (parentId: string, text: string) => Promise<void>;
  onLikeComment: (commentId: string) => Promise<void>;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
}

export function EventComments({
  comments,
  onAddComment,
  onReply,
  onLikeComment,
  onAuthorClick,
  currentUserId,
}: Props) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const inputRef = useRef<TextInput>(null);

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
      toast.success("Commentaire ajouté");
    } catch {
      toast.error("Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(parentId, replyText.trim());
      setReplyText("");
      setReplyingTo(null);
      toast.success("Réponse ajoutée");
    } catch {
      toast.error("Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  if (comments.length === 0) {
    return (
      <View className="space-y-3"><Text className="text-white/30 text-sm text-center py-4">Aucun commentaire pour le moment
        </Text><CommentInput value={newComment} onChange={setNewComment} onSubmit={handleSubmit} isSubmitting={isSubmitting} inputRef={inputRef} /></View>
    );
  }

  return (
    <View className="space-y-4"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Commentaires ({comments.length})
      </Text><View className="space-y-3 max-h-[400px] overflow-y-auto pr-1">{comments.map((comment) => {
          const isExpanded = expandedReplies.has(comment._id);
          const hasReplies = comment.replies && comment.replies.length > 0;

          return (
            <View key={comment._id} className="space-y-2"><CommentItem comment={comment} isOwner={currentUserId === comment.authorId} onLike={onLikeComment} onReply={() => setReplyingTo(comment._id)} onAuthorClick={onAuthorClick} formatDate={formatDate} />{hasReplies && (
                <>
                  <Pressable onPress={() => toggleReplies(comment._id)} className="ml-10 text-xs text-purple-400 transition-colors">{isExpanded
                      ? "Voir moins"
                      : `Voir les ${comment.replies!.length} réponses`}</Pressable>

<View>
                    {isExpanded && (
                      <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="ml-10 space-y-2 border-l border-white/5 pl-3 overflow-hidden">
                        {comment.replies!.map((reply) => (
                          <CommentItem
                            key={reply._id}
                            comment={reply}
                            isOwner={currentUserId === reply.authorId}
                            onLike={onLikeComment}
                            onReply={() => setReplyingTo(reply._id)}
                            onAuthorClick={onAuthorClick}
                            formatDate={formatDate}
                            isReply
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}{replyingTo === comment._id && (
                <ReplyInput
                  value={replyText}
                  onChange={setReplyText}
                  onSubmit={() => handleReplySubmit(comment._id)}
                  onCancel={() => setReplyingTo(null)}
                  isSubmitting={isSubmitting}
                />
              )}</View>
          );
        })}</View><CommentInput value={newComment} onChange={setNewComment} onSubmit={handleSubmit} isSubmitting={isSubmitting} inputRef={inputRef} /></View>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function CommentItem({
  comment,
  isOwner,
  onLike,
  onReply,
  onAuthorClick,
  formatDate,
  isReply = false,
}: {
  comment: any;
  isOwner: boolean;
  onLike: (id: string) => Promise<void>;
  onReply: () => void;
  onAuthorClick?: (id: string) => void;
  formatDate: (ts: number) => string;
  isReply?: boolean;
}) {
  const handleAuthorClick = () => {
    if (onAuthorClick && comment.authorId) {
      onAuthorClick(comment.authorId);
    }
  };

  return (
    <View className={`flex gap-3 ${isReply ? "ml-2" : ""}`}><Pressable onPress={handleAuthorClick} className="flex-shrink-0">{comment.authorAvatar ? (
          <Image className="w-8 h-8 rounded-full object-cover" source={{ uri: comment.authorAvatar }} accessibilityLabel={comment.authorName} />
        ) : (
          <View className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20"><User size={14} className="text-purple-400" /></View>
        )}</Pressable><View className="flex-1 min-w-0"><View className="flex items-center gap-2 flex-wrap"><Pressable onPress={handleAuthorClick} className="text-white/80 text-sm font-medium">{comment.authorName || "Anonyme"}</Pressable><Text className="text-white/20 text-xs">{formatDate(comment._creationTime)}</Text>{isOwner && (
            <Text className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">Vous
            </Text>
          )}</View><Text className="text-white/70 text-sm">{comment.text}</Text><View className="flex items-center gap-3 mt-1"><Pressable onPress={() => onLike(comment._id)} className="flex items-center gap-1 text-xs text-white/40 transition-colors"><Heart size={12} className={comment.likedByMe ? "fill-red-500 text-red-500" : ""} />{comment.likeCount > 0 && <Text>{comment.likeCount}</Text>}</Pressable>{!isReply && (
            <Pressable onPress={onReply} className="text-xs text-white/40 transition-colors">
              Répondre
            </Pressable>
          )}</View></View></View>
  );
}

function CommentInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  inputRef?: React.RefObject<TextInput | null>;
}) {
  return (
    <View className="flex gap-2">
      <TextInput ref={inputRef} value={value} onChangeText={(value) => onChange(value)} placeholder="Ajouter un commentaire..." className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" onKeyPress={(e) => e.nativeEvent.key === "Enter" && onSubmit()} editable={!(isSubmitting)} />
      <Pressable onPress={onSubmit} disabled={!value.trim() || isSubmitting} className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-40 active:scale-95 transition-transform" style={{  }}>
        {isSubmitting ? "..." : "Envoyer"}
      </Pressable>
    </View>
  );
}

function ReplyInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  return (
    <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 ml-10">
      <TextInput value={value} onChangeText={(value) => onChange(value)} placeholder="Votre réponse..." className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" onKeyPress={(e) => e.nativeEvent.key === "Enter" && onSubmit()} autoFocus editable={!(isSubmitting)} />
      <Pressable onPress={onSubmit} disabled={!value.trim() || isSubmitting} className="px-3 py-2 rounded-xl text-white font-medium disabled:opacity-40 active:scale-95 transition-transform" style={{  }}>
        <Send size={14} />
      </Pressable>
      <Pressable onPress={onCancel} className="px-3 py-2 rounded-xl text-white/40 transition-colors">
        <X size={14} />
      </Pressable>
    </View>
  );
}
