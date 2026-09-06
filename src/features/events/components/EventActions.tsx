import { View, Text, Pressable } from "react-native";
// src/features/events/components/EventActions.tsx
import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Calendar as CalendarIcon,
  Flag,
  MoreVertical,
} from "lucide-react-native";

interface Props {
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onAddToCalendar?: () => void;
  onReport?: () => void;
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export function EventActions({
  onLike,
  onComment,
  onShare,
  onBookmark,
  onAddToCalendar,
  onReport,
  isLiked,
  isBookmarked,
  likeCount,
  commentCount,
  shareCount,
}: Props) {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<View>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    };
    undefined("mousedown", handleClickOutside);
    return () => undefined("mousedown", handleClickOutside);
  }, []);

  return (
    <View
      className="flex items-center justify-between p-2 rounded-xl"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
    >
      {/* Like */}
      <Pressable
        onPress={onLike}
        className="flex items-center gap-1.5 text-xs font-medium"
        style={{  }}
      >
        <Heart size={18} className={isLiked ? "fill-pink-500" : ""} />
        {likeCount > 0 && <Text>{likeCount}</Text>}
      </Pressable>

      {/* Comment */}
      <Pressable
        onPress={onComment}
        className="flex items-center gap-1.5 text-xs font-medium text-white/40"
      >
        <MessageCircle size={18} />
        {commentCount > 0 && <Text>{commentCount}</Text>}
      </Pressable>

      {/* Share */}
      <Pressable
        onPress={onShare}
        className="flex items-center gap-1.5 text-xs font-medium text-white/40"
      >
        <Share2 size={18} />
        {shareCount > 0 && <Text>{shareCount}</Text>}
      </Pressable>

      {/* Bookmark */}
      <Pressable
        onPress={onBookmark}
        className="flex items-center gap-1.5 text-xs font-medium"
        style={{  }}
      >
        <Bookmark size={18} className={isBookmarked ? "fill-amber-400" : ""} />
      </Pressable>

      {/* More */}
      <View className="relative" ref={moreRef}>
        <Pressable
          onPress={() => setShowMore(!showMore)}
          className="text-white/20"
        >
          <MoreVertical size={16} />
        </Pressable>

        {showMore && (
          <View
            className="absolute bottom-full right-0 mb-2 w-48 rounded-xl overflow-hidden shadow-xl z-20"
            style={{ backgroundColor: "rgba(20,10,30,0.95)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            {onAddToCalendar && (
              <Pressable
                onPress={() => {
                  onAddToCalendar();
                  setShowMore(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80"
              >
                <CalendarIcon size={14} />
                <Text>Ajouter au calendrier</Text></Pressable>
            )}
            {onReport && (
              <Pressable
                onPress={() => {
                  onReport();
                  setShowMore(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400"
              >
                <Flag size={14} />
                <Text>Signaler</Text></Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
