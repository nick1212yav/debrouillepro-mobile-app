import { View, Text, TextInput, Pressable } from "react-native";

// src/features/network/components/Network/FollowersList.tsx
import { useState } from "react";
import { Search, Users, UserCheck, UserX, Loader2 } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatar } from "../Profile/ProfileAvatar";
import { FollowButton } from "@/features/network/components/common/FollowButton";
import type { Id } from "@/convex/_generated/dataModel";

export interface Follower {
  _id: Id<"users">;
  name: string;
  avatar?: string | null;
  headline?: string;
  city?: string;
  isFollowing?: boolean;
  isFollowedByMe?: boolean;
  followedAt: string;
}

interface FollowersListProps {
  followers: Follower[];
  totalCount: number;
  isLoading?: boolean;
  isOwnProfile?: boolean;
  onUserClick?: (userId: Id<"users">) => void;
  onFollowToggle?: (userId: Id<"users">, isFollowing: boolean) => void;
  onRemoveFollower?: (userId: Id<"users">) => void;
  className?: string;
  limit?: number;
  showSearch?: boolean;
}

export function FollowersList({
  followers,
  totalCount,
  isLoading = false,
  isOwnProfile = false,
  onUserClick,
  onFollowToggle,
  onRemoveFollower,
  className,
  limit = 20,
  showSearch = true,
}: FollowersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const displayLimit = showAll
    ? followers.length
    : Math.min(followers.length, limit);
  const displayFollowers = followers.slice(0, displayLimit);

  const filteredFollowers = searchQuery
    ? displayFollowers.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.city?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : displayFollowers;

  const hasMore = followers.length > limit && !showAll;

  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-6 h-6 rounded-full" /><Skeleton className="h-4 w-24 rounded-lg" /><Skeleton className="h-4 w-8 rounded-lg" /></View>{showSearch && <Skeleton className="h-8 w-32 rounded-xl" />}</View>{Array.from({ length: 3 }).map((_, i) => (
          <View key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5"><Skeleton className="w-10 h-10 rounded-full" /><View className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32 rounded-lg" /><Skeleton className="h-3 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View>
        ))}</View>
    );
  }

  if (followers.length === 0) {
    return (
      <View className={cn(
          "rounded-3xl p-6 text-center",
          "bg-white/5 border border-white/10",
          className,
        )}><Users size={32} className="mx-auto mb-3 text-white/20" /><Text className="text-white font-semibold text-sm">Aucun abonné</Text><Text className="text-white/40 text-xs mt-1">{isOwnProfile
            ? "Vos abonnés apparaîtront ici"
            : "Ce profil n'a pas encore d'abonnés"}</Text></View>
    );
  }

  return (
    <View className={cn("space-y-3", className)}>{}<View className="flex items-center justify-between"><View className="flex items-center gap-2"><Users size={16} className="text-indigo-400" /><Text className="text-white font-semibold text-sm">Abonnés</Text><Text className="text-white/30 text-xs">({totalCount})</Text></View>{showSearch && followers.length > 5 && (
          <View className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/5">
            <Search size={12} className="text-white/30" />
            <TextInput value={searchQuery} onChangeText={(value) => setSearchQuery(value)} placeholder="Rechercher..." className="w-24 bg-transparent text-white/80 text-xs outline-none placeholder:text-white/20" />
          </View>
        )}</View>{}<View>{filteredFollowers.length === 0 ? (
          <Text className="text-white/30 text-sm text-center py-4">
            Aucun résultat pour "{searchQuery}"
          </Text>
        ) : (
          <View className="space-y-2">
            {filteredFollowers.map((follower, index) => (
              <View key={follower._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03 }} className="flex items-center gap-3 p-3 rounded-xl transition-colors">
                <Pressable onPress={() => onUserClick?.(follower._id)} className="flex-shrink-0">
                  <ProfileAvatar
                    name={follower.name}
                    avatar={follower.avatar}
                    size="md"
                  />
                </Pressable>

                <View className="flex-1 min-w-0">
                  <Pressable onPress={() => onUserClick?.(follower._id)} className="text-white font-semibold text-sm truncate w-full text-left">
                    {follower.name}
                  </Pressable>
                  {follower.headline && (
                    <Text className="text-white/40 text-xs truncate">
                      {follower.headline}
                    </Text>
                  )}
                  {follower.city && (
                    <Text className="text-white/25 text-[10px]">{follower.city}</Text>
                  )}
                </View>

                <View className="flex items-center gap-1 flex-shrink-0">
                  {isOwnProfile && onRemoveFollower && (
                    <Pressable onPress={() => onRemoveFollower(follower._id)} className="p-1.5 rounded-lg transition-colors" title="Retirer l'abonné">
                      <UserX size={14} className="text-red-400/60" />
                    </Pressable>
                  )}
                  {!isOwnProfile && onFollowToggle && (
                    <FollowButton
                      userId={follower._id}
                      isFollowing={follower.isFollowedByMe ?? false}
                      size="sm"
                      onToggle={(isFollowing) =>
                        onFollowToggle(follower._id, isFollowing)
                      }
                    />
                  )}
                  {isOwnProfile && follower.isFollowing && (
                    <Text className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-indigo-500/20 text-indigo-300">
                      Vous suit
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}</View>{}{hasMore && (
        <Pressable onPress={() => setShowAll(true)} className="w-full py-2 text-sm text-white/40 transition-colors">
          Voir plus ({followers.length - limit} autres)
        </Pressable>
      )}</View>
  );
}
