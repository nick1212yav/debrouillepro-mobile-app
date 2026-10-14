import { Pressable, View, Text } from "react-native";
import { Heart, Share2, Bookmark, MessageCircle } from "lucide-react-native";
import type { ReactNode } from "react";

interface Props {
  onLike?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onComment?: () => void;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
}

interface ActionButtonProps {
  label: string;
  count?: number;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  children: ReactNode;
}

function ActionButton({
  label,
  count,
  onPress,
  disabled = false,
  accessibilityLabel,
  children,
}: ActionButtonProps) {
  const showCount = typeof count === "number" && count > 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-lg py-2 active:bg-white/10"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {children}
      <Text className="text-xs text-white/60">
        {showCount ? `${label} ${count}` : label}
      </Text>
    </Pressable>
  );
}

export function ServiceFooter({
  onLike,
  onShare,
  onBookmark,
  onComment,
  isLiked = false,
  isBookmarked = false,
  likeCount = 0,
  commentCount = 0,
  shareCount = 0,
}: Props) {
  const safeLikeCount = Math.max(0, likeCount);
  const safeCommentCount = Math.max(0, commentCount);
  const safeShareCount = Math.max(0, shareCount);

  return (
    <View className="flex-row items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-3">
      <ActionButton
        label="J'aime"
        count={safeLikeCount}
        onPress={onLike}
        accessibilityLabel={
          isLiked
            ? `Retirer le J'aime, ${safeLikeCount} mentions`
            : `Aimer, ${safeLikeCount} mentions`
        }
      >
        <Heart
          size={18}
          color={isLiked ? "#EF4444" : "#9CA3AF"}
          fill={isLiked ? "#EF4444" : "none"}
        />
      </ActionButton>

      <ActionButton
        label="Commenter"
        count={safeCommentCount}
        onPress={onComment}
        disabled={!onComment}
        accessibilityLabel={
          onComment
            ? `${safeCommentCount} commentaires`
            : `${safeCommentCount} commentaires, fonctionnalité indisponible ici`
        }
      >
        <MessageCircle size={18} color="#9CA3AF" />
      </ActionButton>

      <ActionButton
        label="Partager"
        count={safeShareCount}
        onPress={onShare}
        accessibilityLabel={`Partager, ${safeShareCount} partages`}
      >
        <Share2 size={18} color="#9CA3AF" />
      </ActionButton>

      <Pressable
        onPress={onBookmark}
        disabled={!onBookmark}
        accessibilityRole="button"
        accessibilityLabel={
          isBookmarked ? "Retirer des favoris" : "Ajouter aux favoris"
        }
        accessibilityState={{ selected: isBookmarked }}
        hitSlop={8}
        className="items-center justify-center rounded-lg p-2 active:bg-white/10"
        style={{ opacity: onBookmark ? 1 : 0.5 }}
      >
        <Bookmark
          size={18}
          color={isBookmarked ? "#FBBF24" : "#9CA3AF"}
          fill={isBookmarked ? "#FBBF24" : "none"}
        />
      </Pressable>
    </View>
  );
}
