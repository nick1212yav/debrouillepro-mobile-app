import { View, Text, TextInput } from "react-native";

// src/features/network/components/Network/FollowingList.tsx
import { useState } from "react";
import { Search, UserPlus, UserCheck, UserX, Loader2 } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatar } from "../Profile/ProfileAvatar";
import { FollowButton } from "@/features/network/components/common/FollowButton";
import type { Id } from "@/convex/_generated/dataModel";

export interface Following {
  _id: Id<"users">;
  name: string;
  avatar?: string | null;
  headline?: string;
  city?: string;
  isFollowing?: boolean;
  isFollowedByMe?: boolean;
  followedAt: string;
}

interface FollowingListProps {
  following: Following[];
  totalCount: number;
  isLoading?: boolean;
  isOwnProfile?: boolean;
  onUserClick?: (userId: Id<"users">) => void;
  onFollowToggle?: (userId: Id<"users">, isFollowing: boolean) => void;
  onUnfollow?: (userId: Id<"users">) => void;
  className?: string;
  limit?: number;
  showSearch?: boolean;
}

export function FollowingList({
  following,
  totalCount,
  isLoading = false,
  isOwnProfile = false,
  onUserClick,
  onFollowToggle,
  onUnfollow,
  className,
  limit = 20,
  showSearch = true,
}: FollowingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const displayLimit = showAll
    ? following.length
    : Math.min(following.length, limit);
  const displayFollowing = following.slice(0, displayLimit);

  const filteredFollowing = searchQuery
    ? displayFollowing.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.city?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : displayFollowing;

  const hasMore = following.length > limit && !showAll;

  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}>
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-8 rounded-lg" />
          </View>
          {showSearch && <Skeleton className="h-8 w-32 rounded-xl" />}
        </View>
        {Array.from({ length: 3 }).map((_, i) => (
          <View
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
          >
            <Skeleton className="w-10 h-10 rounded-full" />
            <View className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </View>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </View>
        ))}
      </View>
    );
  }

  if (following.length === 0) {
    return (
      <View
        className={cn(
          "rounded-3xl p-6 text-center",
          "bg-white/5 border border-white/10",
          className,
        )}
      >
        <UserPlus size={32} className="mx-auto mb-3 text-white/20" />
        <Text className="text-white font-semibold text-sm">Aucun abonnement</Text>
        <Text className="text-white/40 text-xs mt-1">
          {isOwnProfile
            ? "Les personnes que vous suivez apparaîtront ici"
            : "Ce profil ne suit personne pour l'instant"}
        </Text>
      </View>
    );
  }

  return (
    <View className={cn("space-y-3", className)}>
      {/* Header */}
      <View className="flex items-center justify-between">
        <View className="flex items-center gap-2">
          <UserPlus size={16} className="text-emerald-400" />
          <Text className="text-white font-semibold text-sm"><Text>Abonnements</Text></Text>
          <Text className="text-white/30 text-xs"><Text>(</Text>{totalCount}<Text>)</Text></Text>
        </View>
        {showSearch && following.length > 5 && (
          <View className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/5">
            <Search size={12} className="text-white/30" />
            <TextInput
             
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              placeholder="Rechercher..."
              className="w-24 bg-transparent text-white/80 text-xs outline-none placeholder:text-white/20"
            />
          </View>
        )}
      </View>

      {/* List */}
      <>
        {filteredFollowing.length === 0 ? (
          <Text className="text-white/30 text-sm text-center py-4">
            <Text>Aucun résultat pour "</Text>{searchQuery}<Text>"</Text></Text>
        ) : (
          <View className="space-y-2">
            {filteredFollowing.map((follow, index) => (
              <View
                key={follow._id}
                className="flex items-center gap-3 p-3 rounded-xl"
              >
                <Pressable
                  onPress={() => onUserClick?.(follow._id)}
                  className="flex-shrink-0"
                >
                  <ProfileAvatar
                    name={follow.name}
                    avatar={follow.avatar}
                    size="md"
                  />
                </Pressable>

                <View className="flex-1 min-w-0">
                  <Pressable
                    onPress={() => onUserClick?.(follow._id)}
                    className="text-white font-semibold text-sm truncate w-full text-left"
                  >
                    {follow.name}
                  </Pressable>
                  {follow.headline && (
                    <Text className="text-white/40 text-xs truncate">
                      {follow.headline}
                    </Text>
                  )}
                  {follow.city && (
                    <Text className="text-white/25 text-[10px]">{follow.city}</Text>
                  )}
                </View>

                <View className="flex items-center gap-1 flex-shrink-0">
                  {isOwnProfile && onUnfollow && (
                    <Pressable
                      onPress={() => onUnfollow(follow._id)}
                      className="p-1.5 rounded-lg"
                      title="Se désabonner"
                    >
                      <UserX size={14} className="text-red-400/60" />
                    </Pressable>
                  )}
                  {!isOwnProfile && onFollowToggle && (
                    <FollowButton
                      userId={follow._id}
                      isFollowing={follow.isFollowedByMe ?? false}
                      size="sm"
                      onToggle={(isFollowing) =>
                        onFollowToggle(follow._id, isFollowing)
                      }
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </>

      {/* Load more */}
      {hasMore && (
        <Pressable
          onPress={() => setShowAll(true)}
          className="w-full py-2 text-sm text-white/40"
        >
          <Text>Voir plus (</Text>{following.length - limit} <Text>autres)</Text></Pressable>
      )}
    </View>
  );
}
