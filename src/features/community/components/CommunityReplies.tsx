import { Pressable, View, Text, Image, TextInput } from "react-native";
import { useState } from "react";
import { User, Heart, Send, X } from "lucide-react-native";
import type { CommunityComment } from "../types";

interface Props {
  replies: CommunityComment[];
  onLikeReply: (replyId: string) => Promise<void>;
  onDeleteReply: (replyId: string) => Promise<void>;
  onReply: (parentId: string, text: string) => Promise<void>;
  currentUserId?: string;
  parentId: string;
}

export function CommunityReplies({
  replies,
  onLikeReply,
  onDeleteReply,
  onReply,
  currentUserId,
  parentId,
}: Props) {
  const [replying, setReplying] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!replies || replies.length === 0) return null;

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleReplySubmit = async (replyToId: string) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(replyToId, replyText.trim());
      setReplyText("");
      setReplying(null);
    } catch {
      // erreur gérée par le parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="ml-8 space-y-2 border-l border-white/5 pl-3">
      {replies.map((reply) => {
        const isOwner = currentUserId === reply.authorId;
        return (
          <View
            key={reply._id}
            className="flex gap-3"
          >
            {reply.authorAvatar ? (
              <Image
               
               
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
               source={{ uri: reply.authorAvatar }} accessibilityLabel={reply.authorName}/>
            ) : (
              <View className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-500/20 flex-shrink-0">
                <User size={12} className="text-purple-400" />
              </View>
            )}
            <View className="flex-1 min-w-0">
              <View className="flex items-center gap-2">
                <Text className="text-white/70 text-sm font-medium">
                  {reply.authorName || "Anonyme"}
                </Text>
                <Text className="text-white/20 text-[10px]">
                  {formatDate(reply._creationTime)}
                </Text>
                {isOwner && (
                  <Text className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                    Vous
                  </Text>
                )}
              </View>
              <Text className="text-white/60 text-sm">{reply.text}</Text>
              <View className="flex items-center gap-3 mt-0.5">
                <Pressable
                  onPress={() => onLikeReply(reply._id)}
                  className="flex items-center gap-1 text-xs text-white/30"
                >
                  <Heart
                    size={10}
                    className={
                      reply.likedByMe ? "fill-red-500 text-red-500" : ""
                    }
                  />
                  {reply.likeCount > 0 && <Text>{reply.likeCount}</Text>}
                </Pressable>
                <Pressable
                  onPress={() => setReplying(reply._id)}
                  className="text-xs text-white/30"
                >
                  <Text>Répondre</Text></Pressable>
                {isOwner && (
                  <Pressable
                    onPress={() => onDeleteReply(reply._id)}
                    className="text-xs text-red-400/50"
                  >
                    <Text>Supprimer</Text></Pressable>
                )}
              </View>

              {/* Répondre à cette réponse */}
              {replying === reply._id && (
                <View
                  className="flex gap-2 mt-1.5"
                >
                  <TextInput
                    value={replyText}
                    onChangeText={(text) => setReplyText(text)}
                    placeholder="Votre réponse..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/30"
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleReplySubmit(reply._id)
                    }
                  />
                  <Pressable
                    onPress={() => handleReplySubmit(reply._id)}
                    disabled={!replyText.trim() || isSubmitting}
                    className="px-3 py-1.5 rounded-xl text-white font-medium disabled:opacity-40"
                    style={{  }}
                  >
                    <Send size={12} />
                  </Pressable>
                  <Pressable
                    onPress={() => setReplying(null)}
                    className="px-3 py-1.5 rounded-xl text-white/40"
                  >
                    <X size={12} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
