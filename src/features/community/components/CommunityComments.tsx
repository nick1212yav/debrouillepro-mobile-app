import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import {
  User,
  Heart,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react-native";
import type { CommunityComment } from "../types";

// Remplacement de sonner par l'abstraction native UIService
import { UIService } from "@/core/sdk/ui/UIService";

interface Props {
  postId: string;
  comments: CommunityComment[];
  onAddComment: (text: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onLikeComment?: (commentId: string) => Promise<void>;
  onReply?: (commentId: string, text: string) => Promise<void>;
  currentUserId?: string;
  maxHeight?: number | string;
  onAuthorClick?: (authorId: string) => void;
}

export function CommunityComments({
  postId,
  comments,
  onAddComment,
  onDeleteComment,
  onLikeComment,
  onReply,
  currentUserId,
  maxHeight = 400,
  onAuthorClick,
}: Props) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
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
      UIService.openToast("Commentaire ajouté", "success");
    } catch {
      UIService.openToast("Erreur lors de l'ajout du commentaire", "error");
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
      UIService.openToast("Réponse ajoutée", "success");
    } catch {
      UIService.openToast("Erreur lors de l'ajout de la réponse", "error");
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
      <View className="flex flex-row items-center gap-2">
        <Pressable
          onPress={handleClick}
          className="flex flex-row items-center gap-2"
        >
          {authorAvatar ? (
            <Image
              source={{ uri: authorAvatar }}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <View className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 flex-shrink-0">
              <User size={14} className="text-purple-400" />
            </View>
          )}
          <Text className="text-white/80 text-sm font-medium">
            {authorName || "Anonyme"}
          </Text>
        </Pressable>
        <Text className="text-white/20 text-xs">{formatDate(timestamp)}</Text>
        {isOwner && (
          <Text className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
            Vous
          </Text>
        )}
      </View>
    );
  };

  return (
    <View className="space-y-3">
      <View className="flex flex-row items-center gap-2">
        <MessageCircle size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">
          Commentaires ({comments.length})
        </Text>
      </View>

      {/* Liste des commentaires */}
      <ScrollView
        ref={scrollViewRef}
        className="space-y-3 pr-1"
        style={{ maxHeight }}
        showsVerticalScrollIndicator={false}
      >
        {comments.length === 0 ? (
          <Text className="text-white/30 text-sm italic text-center py-4">
            Aucun commentaire pour le moment
          </Text>
        ) : (
          comments.map((comment) => {
            const isOwner = currentUserId === comment.authorId;
            const hasReplies = comment.replies && comment.replies.length > 0;
            const isExpanded = expandedReplies.has(comment._id);

            return (
              <View key={comment._id} className="space-y-2 mb-3">
                {/* Commentaire principal */}
                <View className="flex flex-row gap-3">
                  <View className="flex-1 min-w-0">
                    <AuthorInfo
                      authorId={comment.authorId}
                      authorName={comment.authorName}
                      authorAvatar={comment.authorAvatar}
                      timestamp={comment._creationTime}
                      isOwner={isOwner}
                    />
                    <Text className="text-white/70 text-sm mt-0.5">
                      {comment.text}
                    </Text>
                    <View className="flex flex-row items-center gap-3 mt-1">
                      <Pressable
                        onPress={() => onLikeComment?.(comment._id)}
                        className="flex flex-row items-center gap-1 text-xs"
                      >
                        <Heart
                          size={12}
                          className={
                            comment.likedByMe ? "fill-red-500 text-red-500" : ""
                          }
                          color={
                            comment.likedByMe
                              ? "#EF4444"
                              : "rgba(255,255,255,0.4)"
                          }
                        />
                        {comment.likeCount > 0 && (
                          <Text className="text-white/40 text-xs">
                            {comment.likeCount}
                          </Text>
                        )}
                      </Pressable>

                      <Pressable onPress={() => setReplyingTo(comment._id)}>
                        <Text className="text-xs text-white/40">Répondre</Text>
                      </Pressable>

                      {isOwner && onDeleteComment && (
                        <Pressable onPress={() => onDeleteComment(comment._id)}>
                          <Text className="text-xs text-red-400/50">
                            Supprimer
                          </Text>
                        </Pressable>
                      )}

                      {hasReplies && (
                        <Pressable onPress={() => toggleReplies(comment._id)}>
                          <Text className="text-xs text-purple-400">
                            {isExpanded
                              ? "Voir moins"
                              : `Voir les ${comment.replies!.length} réponses`}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>

                {/* Réponses */}
                {hasReplies && isExpanded && (
                  <View className="ml-10 space-y-2 border-l border-white/5 pl-3">
                    {comment.replies!.map((reply) => {
                      const isReplyOwner = currentUserId === reply.authorId;
                      return (
                        <View
                          key={reply._id}
                          className="flex flex-row gap-3 mb-2"
                        >
                          <View className="flex-1 min-w-0">
                            <AuthorInfo
                              authorId={reply.authorId}
                              authorName={reply.authorName}
                              authorAvatar={reply.authorAvatar}
                              timestamp={reply._creationTime}
                              isOwner={isReplyOwner}
                            />
                            <Text className="text-white/60 text-sm mt-0.5">
                              {reply.text}
                            </Text>
                            <View className="flex flex-row items-center gap-3 mt-0.5">
                              <Pressable
                                onPress={() => onLikeComment?.(reply._id)}
                                className="flex flex-row items-center gap-1 text-xs"
                              >
                                <Heart
                                  size={10}
                                  className={
                                    reply.likedByMe
                                      ? "fill-red-500 text-red-500"
                                      : ""
                                  }
                                  color={
                                    reply.likedByMe
                                      ? "#EF4444"
                                      : "rgba(255,255,255,0.3)"
                                  }
                                />
                                {reply.likeCount > 0 && (
                                  <Text className="text-white/30 text-xs">
                                    {reply.likeCount}
                                  </Text>
                                )}
                              </Pressable>

                              {isReplyOwner && onDeleteComment && (
                                <Pressable
                                  onPress={() => onDeleteComment(reply._id)}
                                >
                                  <Text className="text-xs text-red-400/50">
                                    Supprimer
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Formulaire de réponse */}
                {replyingTo === comment._id && (
                  <View className="ml-10 flex flex-row gap-2">
                    <TextInput
                      value={replyText}
                      onChangeText={(text) => setReplyText(text)}
                      placeholder="Votre réponse..."
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                      onSubmitEditing={() => handleReply(comment._id)}
                    />

                    <Pressable
                      onPress={() => handleReply(comment._id)}
                      disabled={!replyText.trim() || isSubmitting}
                      className="px-3 py-2 rounded-xl flex items-center justify-center disabled:opacity-40"
                      style={{
                        backgroundColor: "#8B5CF6", // Violet
                      }}
                    >
                      <Send size={14} className="text-white" />
                    </Pressable>

                    <Pressable
                      onPress={() => setReplyingTo(null)}
                      className="px-3 py-2 rounded-xl"
                    >
                      <X size={14} className="text-white/40" />
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Ajouter un commentaire */}
      <View className="flex flex-row gap-2 pt-2 border-t border-white/5">
        <TextInput
          value={newComment}
          onChangeText={(text) => setNewComment(text)}
          placeholder="Ajouter un commentaire..."
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
          onSubmitEditing={handleSubmit}
          disabled={isSubmitting}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="px-4 py-2 rounded-xl items-center justify-center disabled:opacity-40"
          style={{
            backgroundColor: "#8B5CF6", // Violet
          }}
        >
          <Text className="text-white font-medium">
            {isSubmitting ? "..." : "Envoyer"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
