import { View, Text } from "react-native";
// src/features/community/components/CommunityActions.tsx
import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Flag,
  Link,
} from "lucide-react-native";

interface Props {
  onLike: () => void; // legacy – sera utilisé si pas de réactions
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onReport?: () => void;
  onReaction?: (emoji: string) => void; // nouvelle callback pour les réactions
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  // Nouvelles props pour les réactions
  reactions?: Record<string, number>; // { "❤️": 5, "😂": 2, ... }
  userReaction?: string; // l'émoji sélectionné par l'utilisateur
}

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡"];

export function CommunityActions({
  onLike,
  onComment,
  onShare,
  onBookmark,
  onReport,
  onReaction,
  isLiked,
  isBookmarked,
  likeCount,
  commentCount,
  shareCount,
  reactions = {},
  userReaction,
}: Props) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(
    userReaction || null,
  );
  const pickerRef = useRef<View>(null);
  const buttonRef = useRef<Pressable>(null);

  // Fermer le picker si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowReactionPicker(false);
      }
    };
    undefined("mousedown", handleClickOutside);
    return () => undefined("mousedown", handleClickOutside);
  }, []);

  const handleReactionSelect = (emoji: string) => {
    // Si l'utilisateur sélectionne le même émoji, on le retire
    if (selectedReaction === emoji) {
      setSelectedReaction(null);
      onReaction?.("");
      onLike(); // on considère que like est retiré
    } else {
      setSelectedReaction(emoji);
      onReaction?.(emoji);
      // Si c'était un like simple, on le transforme en réaction
      if (!isLiked && !userReaction) {
        onLike(); // on like
      }
    }
    setShowReactionPicker(false);
  };

  // Détermine l'icône à afficher
  const getReactionIcon = () => {
    if (selectedReaction) {
      return <Text className="text-xl leading-none">{selectedReaction}</Text>;
    }
    return (
      <Heart size={20} className={isLiked ? "fill-red-500 text-red-500" : ""} />
    );
  };

  // Nombre total de réactions
  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  // Le compteur affiche le total des réactions (ou le likeCount legacy)
  const displayCount = totalReactions > 0 ? totalReactions : likeCount;

  return (
    <View className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
      {/* Bouton Like / Réaction */}
      <View className="relative">
        <Pressable
          ref={buttonRef}
          onPress={() => {
            if (selectedReaction) {
              // Si une réaction est sélectionnée, on la retire
              handleReactionSelect(selectedReaction);
            } else {
              onLike();
            }
          }}
          onMouseEnter={() => setShowReactionPicker(true)}
          // On laisse le picker ouvert au hover, mais on le ferme en cliquant
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{  }}
        >
          {getReactionIcon()}
          {displayCount > 0 && (
            <Text className="text-xs font-medium">{displayCount}</Text>
          )}
        </Pressable>

        {/* Picker de réactions */}
        {showReactionPicker && (
          <View
            ref={pickerRef}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 rounded-2xl shadow-2xl border border-white/10 p-1.5 flex gap-1 z-20 animate-fade-in"
            onMouseLeave={() => setShowReactionPicker(false)}
          >
            {REACTION_EMOJIS.map((emoji) => {
              const count = reactions[emoji] || 0;
              const isActive = selectedReaction === emoji;
              return (
                <Pressable
                  key={emoji}
                  onPress={() => handleReactionSelect(emoji)}
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full
                    text-2xl transition-all hover:scale-125 hover:bg-white/10
                    ${isActive ? "bg-white/20 ring-2 ring-purple-400/50" : ""}
                  `}
                  title={`${emoji} ${count > 0 ? count : ""}`}
                >
                  {emoji}
                  {count > 0 && (
                    <Text className="absolute -bottom-1 -right-1 text-[10px] font-bold text-white/70 bg-zinc-900 rounded-full px-1.5 min-w-[18px] text-center leading-tight">
                      {count}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Commentaire */}
      <Pressable
        onPress={onComment}
        className="flex items-center gap-1.5 text-xs font-medium text-white/40"
      >
        <MessageCircle size={18} />
        {commentCount > 0 && <Text>{commentCount}</Text>}
      </Pressable>

      {/* Partager */}
      <Pressable
        onPress={onShare}
        className="flex items-center gap-1.5 text-xs font-medium text-white/40"
      >
        <Share2 size={18} />
        {shareCount > 0 && <Text>{shareCount}</Text>}
      </Pressable>

      {/* Favori */}
      <Pressable
        onPress={onBookmark}
        className="flex items-center gap-1.5 text-xs font-medium"
        style={{  }}
      >
        <Bookmark size={18} className={isBookmarked ? "fill-amber-400" : ""} />
      </Pressable>

      {/* Plus (report, etc.) */}
      {onReport && (
        <Pressable
          onPress={onReport}
          className="text-white/20"
        >
          <MoreVertical size={16} />
        </Pressable>
      )}
    </View>
  );
}
