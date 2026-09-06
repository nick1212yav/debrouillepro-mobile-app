import { Link } from "expo-router";
import { View, Text, Pressable, Image } from "react-native";
// src/features/community/components/CommunityHeader.tsx
import { User, Clock, CheckCircle, UserPlus, UserCheck } from "lucide-react-native";
import { useState } from "react";

interface Props {
  authorId?: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: number;
  isVerified?: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onViewProfile?: () => void;
}

export function CommunityHeader({
  authorId,
  authorName,
  authorAvatar,
  createdAt,
  isVerified = false,
  isFollowing = false,
  onFollow,
  onUnfollow,
  onViewProfile,
}: Props) {
  const [following, setFollowing] = useState(isFollowing);

  const handleFollowToggle = () => {
    if (following) {
      onUnfollow?.();
    } else {
      onFollow?.();
    }
    setFollowing(!following);
  };

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return `Il y a ${Math.floor(days / 7)} semaines`;
  };

  const ProfileWrapper = ({ children }: { children: React.ReactNode }) => {
    if (authorId) {
      return (
        <Link
          href={`/profile/${authorId}`}
          className="flex items-center gap-1.5"
        >
          {children}
        </Link>
      );
    }
    if (onViewProfile) {
      return (
        <Pressable
          onPress={onViewProfile}
          className="flex items-center gap-1.5"
        >
          {children}
        </Pressable>
      );
    }
    return <View className="flex items-center gap-1.5">{children}</View>;
  };

  return (
    <View className="flex items-start gap-3">
      {/* Avatar */}
      <ProfileWrapper>
        {authorAvatar ? (
          <Image
           
           
            className="w-11 h-11 rounded-full object-cover border-2 border-white/10"
           source={{ uri: authorAvatar }} accessibilityLabel={authorName}/>
        ) : (
          <View className="w-11 h-11 rounded-full flex items-center justify-center bg-purple-500/20 border-2 border-white/10">
            <User size={20} className="text-purple-400" />
          </View>
        )}
      </ProfileWrapper>

      {/* Informations */}
      <View className="flex-1 min-w-0">
        <View className="flex items-center gap-1.5 flex-wrap">
          <ProfileWrapper>
            <Text className="text-white font-semibold text-base truncate">
              {authorName}
            </Text>
          </ProfileWrapper>
          {isVerified && (
            <CheckCircle
              size={16}
              className="text-blue-400 flex-shrink-0 fill-blue-400/20"
            />
          )}
        </View>
        <View className="flex items-center gap-1.5 text-xs text-white/40 mt-0.5">
          <Clock size={12} className="text-white/30" />
          <Text>{timeAgo(createdAt)}</Text>
          {isVerified && (
            <>
              <Text className="w-px h-3 bg-white/10" />
              <Text className="text-blue-400/60 text-[10px] font-medium">
                <Text>Vérifié</Text></Text>
            </>
          )}
        </View>
      </View>

      {/* Bouton Suivre */}
      <Pressable
        onPress={handleFollowToggle}
        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
          following
            ? "bg-white/10 text-white/70 hover:bg-white/20"
            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 hover:text-purple-300"
        }`}
      >
        {following ? (
          <>
            <UserCheck size={14} /> <Text>Suivi</Text></>
        ) : (
          <>
            <UserPlus size={14} /> <Text>Suivre</Text></>
        )}
      </Pressable>
    </View>
  );
}
