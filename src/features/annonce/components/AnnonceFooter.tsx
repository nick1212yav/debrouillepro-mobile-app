import { Pressable, Text, View, Share } from "react-native";
import { Heart, MessageCircle, Share2, Bookmark, Flag } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface Props {
  publicationId: Id<"publications">;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onReport?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  color?: string;
}

export function AnnonceFooter({
  publicationId,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onReport,
  isLiked = false,
  isBookmarked = false,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
  color = "#F97316",
}: Props) {
  const incrementShare = useMutation(api.publications.incrementShare);

  const handleShare = async () => {
    try {
      await incrementShare({ publicationId });
    } catch {
      // Silencieux
    }

    if (navigator.share) {
      try {
        await Share.share({ message: String(window.location.href), title: document.title });
      } catch {
        // Utilisateur a annulé
      }
    } else {
      try {
        await Clipboard.setString(window.location.href);
        toast.info("Lien copié");
      } catch {
        toast.error("Impossible de copier");
      }
    }
    onShare?.();
  };

  return (
    <View className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
      <Pressable onPress={onLike} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{  }}>
        <Heart size={16} className={isLiked ? "fill-red-500" : ""} />
        {likeCount > 0 && <Text>{likeCount}</Text>}
      </Pressable>

      <Pressable onPress={onComment} className="flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors">
        <MessageCircle size={16} />
        {commentCount > 0 && <Text>{commentCount}</Text>}
      </Pressable>

      <Pressable onPress={handleShare} className="flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors">
        <Share2 size={16} />
        {shareCount > 0 && <Text>{shareCount}</Text>}
      </Pressable>

      <Pressable onPress={onBookmark} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{  }}>
        <Bookmark size={16} className={isBookmarked ? "fill-amber-400" : ""} />
      </Pressable>

      <Pressable onPress={onReport} className="text-white/20 transition-colors">
        <Flag size={14} />
      </Pressable>
    </View>
  );
}
