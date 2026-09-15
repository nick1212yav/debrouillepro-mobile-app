import { View, Pressable, Image, Text, TextInput } from "react-native";

// src/features/community/components/CommunityComments.tsx
import { useState, useEffect, useRef } from "react";
import {
  User,
  Heart,
  MessageCircle,
  Send,
  MoreVertical,
  Trash2,
  Flag,
  X,
} from "lucide-react-native";
import { toast } from "sonner";
import type { CommunityComment } from "../types";

/* __DEBROUILLEPRO_NATIVE_DOM_API_HELPERS_V8__ — scrollIntoView helper */
const __debrouilleProNativeScrollIntoView = async (ref: { current?: { measure?: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void } }): Promise<void> => {
  return new Promise((resolve) => {
    ref.current?.measure?.((_x, _y, _w, _h, _px, py) => {
      console.warn('__debrouilleProNativeScrollIntoView: implement scrollTo with pageY on your ScrollView ref');
      resolve();
    });
  });
};


interface Props {
  postId: string;
  comments: CommunityComment[];
  onAddComment: (text: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onReply?: (commentId: string, text: string) => Promise<void>;
  currentUserId?: string;
  maxHeight?: string;
  onAuthorClick?: (authorId: string) => void; // ✅ Nouvelle prop
}

export function CommunityComments({
  postId,
  comments,
  onAddComment,
  onDeleteComment,
  onLikeComment,
  onReply,
  currentUserId,
  maxHeight = "400px",
  onAuthorClick,
}: Props) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const commentsEndRef = useRef<View>(null);

  const scrollToBottom = () => {
    __debrouilleProNativeScrollIntoView(commentsEndRef.current);
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
      toast.success("Commentaire ajouté");
    } catch {
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply?.(commentId, replyText.trim());
      setReplyText("");
      setReplyingTo(null);
      toast.success("Réponse ajoutée");
    } catch {
      toast.error("Erreur lors de l'ajout de la réponse");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Composant pour l'avatar + nom cliquable
  const AuthorInfo = ({
    authorId,
    authorName,
    authorAvatar,
    timestamp,
    isOwner = false,
  }: {
    authorId?: string;
    authorName?: string;
    authorAvatar?: string;
    timestamp: number;
    isOwner?: boolean;
  }) => {
    const handleClick = () => {
      if (authorId && onAuthorClick) {
        onAuthorClick(authorId);
      }
    };

    return (
      <View className="flex items-center gap-2"><Pressable onPress={handleClick} className="flex items-center gap-2 transition-opacity">{authorAvatar ? (
            <Image className="w-8 h-8 rounded-full object-cover flex-shrink-0" source={{ uri: authorAvatar }} accessibilityLabel={authorName} />
          ) : (
            <View className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 flex-shrink-0"><User size={14} className="text-purple-400" /></View>
          )}<Text className="text-white/80 text-sm font-medium">{authorName || "Anonyme"}</Text></Pressable><Text className="text-white/20 text-xs">{formatDate(timestamp)}</Text>{isOwner && (
          <Text className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">Vous
          </Text>
        )}</View>
    );
  };

  return (
    <View className="space-y-3"><View className="flex items-center gap-2"><MessageCircle size={16} className="text-white/30" /><Text className="text-sm font-medium text-white/50">Commentaires ({comments.length})
        </Text></View>{}<View className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight }}>{comments.length === 0 ? (
          <Text className="text-white/30 text-sm italic text-center py-4">Aucun commentaire pour le moment
          </Text>
        ) : (
          comments.map((comment) => {
            const isOwner = currentUserId === comment.authorId;
            const hasReplies = comment.replies && comment.replies.length > 0;
            const isExpanded = expandedReplies.has(comment._id);

            return (
              <View key={comment._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                {/* Commentaire principal */}
                <View className="flex gap-3"><View className="flex-1 min-w-0"><AuthorInfo authorId={comment.authorId} authorName={comment.authorName} authorAvatar={comment.authorAvatar} timestamp={comment._creationTime} isOwner={isOwner} /><Text className="text-white/70 text-sm mt-0.5">{comment.text}</Text><View className="flex items-center gap-3 mt-1"><Pressable onPress={() => onLikeComment?.(comment._id)} className="flex items-center gap-1 text-xs text-white/40 transition-colors"><Heart size={12} className={
                            comment.likedByMe ? "fill-red-500 text-red-500" : ""
                          } />{comment.likeCount > 0 && (
                          <Text>{comment.likeCount}</Text>
                        )}</Pressable><Pressable onPress={() => setReplyingTo(comment._id)} className="text-xs text-white/40 transition-colors"><Text>Répondre</Text></Pressable>{isOwner && onDeleteComment && (
                        <Pressable onPress={() => onDeleteComment(comment._id)} className="text-xs text-red-400/50 transition-colors"><Text>Supprimer</Text></Pressable>
                      )}{hasReplies && (
                        <Pressable onPress={() => toggleReplies(comment._id)} className="text-xs text-purple-400 transition-colors">{isExpanded
                            ? "Voir moins"
                            : `Voir les ${comment.replies!.length} réponses`}</Pressable>
                      )}</View></View></View>

                {/* Réponses */}
                {hasReplies && isExpanded && (
                  <View className="ml-10 space-y-2 border-l border-white/5 pl-3">{comment.replies!.map((reply) => {
                      const isReplyOwner = currentUserId === reply.authorId;
                      return (
                        <View key={reply._id} className="flex gap-3"><View className="flex-1 min-w-0"><AuthorInfo authorId={reply.authorId} authorName={reply.authorName} authorAvatar={reply.authorAvatar} timestamp={reply._creationTime} isOwner={isReplyOwner} /><Text className="text-white/60 text-sm mt-0.5">{reply.text}</Text><View className="flex items-center gap-3 mt-0.5"><Pressable onPress={() => onLikeComment?.(reply._id)} className="flex items-center gap-1 text-xs text-white/30 transition-colors"><Heart size={10} className={
                                    reply.likedByMe
                                      ? "fill-red-500 text-red-500"
                                      : ""
                                  } />{reply.likeCount > 0 && (
                                  <Text>{reply.likeCount}</Text>
                                )}</Pressable>{isReplyOwner && onDeleteComment && (
                                <Pressable onPress={() => onDeleteComment(reply._id)} className="text-xs text-red-400/50 transition-colors"><Text>Supprimer</Text></Pressable>
                              )}</View></View></View>
                      );
                    })}</View>
                )}

                {/* Formulaire de réponse */}
                {replyingTo === comment._id && (
                  <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="ml-10 flex gap-2">
                    <TextInput value={replyText} onChangeText={(value) => setReplyText(value)} placeholder="Votre réponse..." className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" onKeyPress={(e) =>
                        e.nativeEvent.key === "Enter" && handleReply(comment._id)} />
                    <Pressable onPress={() => handleReply(comment._id)} disabled={!replyText.trim() || isSubmitting} className="px-3 py-2 rounded-xl text-white font-medium disabled:opacity-40 active:scale-95 transition-transform" style={{  }}><Send size={14} /></Pressable>
                    <Pressable onPress={() => setReplyingTo(null)} className="px-3 py-2 rounded-xl text-white/40 transition-colors"><X size={14} /></Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}<View ref={commentsEndRef} /></View>{}<View className="flex gap-2 pt-2 border-t border-white/5"><TextInput value={newComment} onChangeText={(value) => setNewComment(value)} placeholder="Ajouter un commentaire..." className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" onKeyPress={(e) => e.nativeEvent.key === "Enter" && handleSubmit()} editable={!(isSubmitting)} /><Pressable onPress={handleSubmit} disabled={!newComment.trim() || isSubmitting} className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-40 active:scale-95 transition-transform" style={{  }}>{isSubmitting ? "..." : "Envoyer"}</Pressable></View></View>
  );
}
