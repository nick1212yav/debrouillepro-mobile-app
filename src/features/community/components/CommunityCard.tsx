import { useRouter } from "expo-router";
import { View, Image, Text, Pressable, GestureResponderEvent } from "react-native";

// src/features/community/components/CommunityCard.tsx
import { useState, useMemo } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  Smile,
  Globe,
  Lock,
  Users,
  Play,
  Volume2,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { CommunityPost, Mood } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  post: CommunityPost;
  index: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onVote?: (optionId: string) => void;
  onNavigate?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😊",
  sad: "😢",
  excited: "🤩",
  angry: "😡",
  peaceful: "😌",
  funny: "😂",
  loved: "🥰",
  tired: "😴",
  inspired: "💡",
};

const AUDIENCE_ICONS = {
  public: Globe,
  friends: Users,
  private: Lock,
};

// ─── Sous-composants optimisés ──────────────────────────────────────────────

function ImageGallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const displayImages = useMemo(() => images.slice(0, 4), [images]);
  const remaining = images.length - 4;

  if (!images.length) return null;

  return (
    <>
      <View className="gap-1 rounded-xl overflow-hidden mt-3">
        {displayImages.map((url, idx) => (
          <Pressable
            key={idx}
            onPress={(e) => {
              setSelected(url);
            }}
            className="relative aspect-square bg-black/20 overflow-hidden group"
          >
            <Image
             
             
              className="w-full h-full object-cover"
              loading="lazy"
             source={{ uri: url }} accessibilityLabel={`Image ${idx + 1}`}/>
            {idx === 3 && remaining > 0 && (
              <View className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Text className="text-white font-bold text-lg">
                  +{remaining}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Lightbox */}
      <>
        {selected && (
          <Pressable
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onPress={() => setSelected(null)}
          >
            <Image
              src={selected}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <Pressable
              onPress={() => setSelected(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Text className="text-white text-xl">✕</Text>
            </Pressable>
          </Pressable>
        )}
      </>
    </>
  );
}

function VideoGallery({ videos }: { videos: string[] }) {
  if (!videos.length) return null;

  return (
    <View className="gap-1 mt-3">
      {videos.slice(0, 2).map((url, idx) => (
        <Pressable
          key={idx}
          className="relative aspect-video rounded-xl overflow-hidden bg-black/20 group"
          onPress={(e) => e.stopPropagation()}
        >
          <View
            src={url}
            className="w-full h-full object-cover"
            controls={false}
            muted
            playsInline
          />
          <View className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play size={28} className="text-white/90" />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function AudioPlayer({ audio }: { audio: string }) {
  if (!audio) return null;

  return (
    <View className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
      <Volume2 size={16} className="text-white/60" />
      <View controls className="w-full h-8" src={audio} />
    </View>
  );
}

function PollDisplay({
  options,
  votedId,
  totalVotes,
  onVote,
}: {
  options: { id: string; text: string; votes: number }[];
  votedId?: string;
  totalVotes: number;
  onVote?: (id: string) => void;
}) {
  if (!options.length) return null;

  return (
    <View className="mt-3 space-y-2 bg-white/5 rounded-xl p-4">
      {options.map((opt) => {
        const pct = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
        const isVoted = votedId === opt.id;

        return (
          <Pressable
            key={opt.id}
            onPress={() => onVote?.(opt.id)}
            disabled={!!votedId}
            className={`relative w-full rounded-lg overflow-hidden transition-all ${
              isVoted ? "ring-2 ring-purple-400 ring-offset-1" : ""
            }`}
          >
            <View
              className="h-9 bg-purple-500/20"
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
            <View className="absolute inset-0 flex items-center justify-between px-3 text-sm">
              <Text className="text-white/80 font-medium">{opt.text}</Text>
              <Text className="text-white/50 text-xs">{Math.round(pct)}%</Text>
            </View>
          </Pressable>
        );
      })}
      <Text className="text-[10px] text-white/30 text-right">
        {totalVotes} vote{totalVotes > 1 ? "s" : ""}
      </Text>
    </View>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  count,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: (e: GestureResponderEvent) => void;
  active?: boolean;
  count?: number;
}) {
  return (
    <Pressable
      onPress={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? "text-red-400 bg-red-500/10"
          : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon size={16} className={active ? "fill-red-400 text-red-400" : ""} />
      <Text>{label}</Text>
      {count !== undefined && count > 0 && (
        <Text className="text-[10px] opacity-60">{count}</Text>
      )}
    </Pressable>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function CommunityCard({
  post,
  index,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onVote,
  onNavigate,
}: Props) {
  const router = useRouter();
  const meta = post.meta || {};

  // Médias
  const images = useMemo(
    () => (post.images?.length ? post.images : meta.images || []),
    [post.images, meta.images],
  );
  const videos = meta.videos || [];
  const audio = meta.audio?.[0];
  const location = meta.location;
  const mood = meta.mood as Mood | undefined;
  const audience = meta.audience || "public";
  const mentions = meta.mentions || [];
  const pollOptions = meta.pollOptions || [];
  const totalVotes = pollOptions.reduce((acc, o) => acc + o.votes, 0);
  const votedId = post.votedOptionId;

  const timeAgo = formatDistanceToNow(post._creationTime, {
    addSuffix: true,
    locale: fr,
  });

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      router.push(`/community/${post._id}`);
    }
  };

  const AudienceIcon =
    AUDIENCE_ICONS[audience as keyof typeof AUDIENCE_ICONS] || Globe;
  const moodEmoji = mood ? MOOD_EMOJI[mood] : null;

  return (
    <Pressable
      onPress={handleCardClick}
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
    >
      {/* En-tête */}
      <View className="px-4 pt-4 pb-2 flex items-start gap-3">
        {/* Avatar */}
        <View className="flex-shrink-0">
          {post.authorAvatar ? (
            <Image
             
             
              className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"
             source={{ uri: post.authorAvatar }} accessibilityLabel=""/>
          ) : (
            <View className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 flex items-center justify-center text-purple-400 font-bold text-sm ring-1 ring-white/10">
              {post.authorName?.charAt(0).toUpperCase() || "?"}
            </View>
          )}
        </View>

        {/* Infos auteur */}
        <View className="flex-1 min-w-0">
          <View className="flex items-center gap-1.5 flex-wrap">
            <Text className="text-white font-semibold text-sm truncate">
              {post.authorName || "Anonyme"}
            </Text>
            <Text className="text-[10px] text-white/40">·</Text>
            <Text className="text-[10px] text-white/40">{timeAgo}</Text>
          </View>
          <View className="flex items-center gap-1 text-[10px] text-white/30">
            <AudienceIcon size={10} />
            <Text className="capitalize">
              {audience === "public"
                ? "Public"
                : audience === "friends"
                  ? "Amis"
                  : "Privé"}
            </Text>
          </View>
        </View>

        {/* Actions supplémentaires */}
        <Pressable
          onPress={(e) => {
            // Menu contextuel (à implémenter plus tard)
            console.log("More options");
          }}
          className="text-white/30"
        >
          <MoreHorizontal size={18} />
        </Pressable>
      </View>

      {/* Contenu principal */}
      <View className="px-4 pb-2 space-y-2">
        {post.title && (
          <Text className="text-white font-bold text-base leading-tight">
            {post.title}
          </Text>
        )}
        <Text className="text-white/80 text-sm leading-relaxed">
          {post.description}
        </Text>

        {/* Mentions */}
        {mentions.length > 0 && (
          <View className="flex flex-wrap gap-1 mt-1">
            {mentions.map((user) => (
              <Text
                key={user}
                className="text-purple-400 text-xs font-medium"
                onPress={(e) => e.stopPropagation()}
              >
                @{user}
              </Text>
            ))}
          </View>
        )}

        {/* Médias */}
        {images.length > 0 && <ImageGallery images={images} />}
        {videos.length > 0 && <VideoGallery videos={videos} />}
        {audio && <AudioPlayer audio={audio} />}

        {/* Humeur */}
        {moodEmoji && (
          <View className="flex items-center gap-1 text-white/40 text-xs mt-1">
            <Smile size={12} />
            <Text>{moodEmoji}</Text>
          </View>
        )}

        {/* Lieu */}
        {location && (
          <View className="flex items-center gap-1 text-white/40 text-xs mt-1">
            <MapPin size={12} />
            <Text className="truncate">{location}</Text>
          </View>
        )}

        {/* Hashtags */}
        {post.tags.length > 0 && (
          <View className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <Text
                key={tag}
                className="text-purple-400 text-xs font-medium"
                onPress={(e) => {
                  router.push(`/?search=${tag.replace("#", "")}`);
                }}
              >
                {tag}
              </Text>
            ))}
          </View>
        )}

        {/* Sondage */}
        {pollOptions.length > 0 && (
          <PollDisplay
            options={pollOptions}
            votedId={votedId}
            totalVotes={totalVotes}
            onVote={onVote}
          />
        )}
      </View>

      {/* Statistiques */}
      <View className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
        <Text>{post.likeCount} J'aime</Text>
        <Text>{post.commentCount} Commentaires</Text>
        <Text>{post.shareCount || 0} Partages</Text>
      </View>

      {/* Actions */}
      <View className="px-2 py-1.5 border-t border-white/5 flex items-center justify-between">
        <ActionButton
          icon={Heart}
          label="J'aime"
          onPress={(e) => {
            onLike();
          }}
          active={post.likedByMe}
          count={post.likeCount}
        />
        <ActionButton
          icon={MessageCircle}
          label="Commenter"
          onPress={(e) => {
            onComment();
          }}
          count={post.commentCount}
        />
        <ActionButton
          icon={Share2}
          label="Partager"
          onPress={(e) => {
            onShare();
          }}
          count={post.shareCount}
        />
        <Pressable
          onPress={(e) => {
            onBookmark();
          }}
          className="p-2 rounded-xl text-white/30"
          accessibilityLabel={
            post.bookmarkedByMe ? "Retirer des favoris" : "Ajouter aux favoris"
          }
        >
          <Bookmark
            size={16}
            className={
              post.bookmarkedByMe ? "fill-purple-400 text-purple-400" : ""
            }
          />
        </Pressable>
      </View>
    </Pressable>
  );
}
