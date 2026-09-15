import { Pressable, View } from "react-native";
import { Heart, Share2, Bookmark, MessageCircle } from "lucide-react-native";

interface Props {
  onLike?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

export function ServiceFooter({
  onLike,
  onShare,
  onBookmark,
  isLiked = false,
  isBookmarked = false,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
}: Props) {
  return (
    <View className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
      <Pressable onPress={onLike} className="flex items-center gap-1.5 text-xs transition-colors" style={{  }}>
        <Heart size={16} className={isLiked ? "fill-red-500" : ""} />{" "}
        {likeCount > 0 && likeCount}
      </Pressable>
      <Pressable className="flex items-center gap-1.5 text-xs text-white/40">
        <MessageCircle size={16} /> {commentCount > 0 && commentCount}
      </Pressable>
      <Pressable onPress={onShare} className="flex items-center gap-1.5 text-xs text-white/40">
        <Share2 size={16} /> {shareCount > 0 && shareCount}
      </Pressable>
      <Pressable onPress={onBookmark} className="flex items-center gap-1.5 text-xs text-white/40">
        <Bookmark
          size={16}
          className={isBookmarked ? "fill-amber-400 text-amber-400" : ""}
        />
      </Pressable>
    </View>
  );
}
