import { Pressable, Text, View } from "react-native";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react-native";

interface Props {
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

export function CommunityFooter({
  onLike,
  onComment,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
}: Props) {
  return (
    <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
      <Pressable onPress={onLike} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{  }}>
        <Heart size={16} className={isLiked ? "fill-red-500" : ""} />
        {likeCount > 0 && <Text>{likeCount}</Text>}
      </Pressable>

      <Pressable onPress={onComment} className="flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors">
        <MessageCircle size={16} />
        {commentCount > 0 && <Text>{commentCount}</Text>}
      </Pressable>

      <Pressable onPress={onShare} className="flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors">
        <Share2 size={16} />
        {shareCount > 0 && <Text>{shareCount}</Text>}
      </Pressable>

      <Pressable onPress={onBookmark} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{  }}>
        <Bookmark size={16} className={isBookmarked ? "fill-amber-400" : ""} />
      </Pressable>
    </View>
  );
}
