import { Pressable, Text, View } from "react-native";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react-native";

interface Props {
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  isLiked: boolean;
  isBookmarked: boolean;
}

export function JobActions({
  likeCount,
  commentCount,
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked,
  isBookmarked,
}: Props) {
  return (
    <View className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
      <Pressable onPress={onLike} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 transition-colors">
        <Heart
          size={14}
          className={isLiked ? "fill-purple-400 text-purple-400" : ""}
        />
        <Text>{likeCount > 0 ? likeCount : ""}</Text>
      </Pressable>

      <Pressable onPress={onComment} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 transition-colors">
        <MessageCircle size={14} />
        <Text>{commentCount > 0 ? commentCount : ""}</Text>
      </Pressable>

      <Pressable onPress={onShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 transition-colors">
        <Share2 size={14} />
      </Pressable>

      <Pressable onPress={onBookmark} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 transition-colors ml-auto">
        <Bookmark
          size={14}
          className={isBookmarked ? "fill-yellow-400 text-yellow-400" : ""}
        />
      </Pressable>
    </View>
  );
}
