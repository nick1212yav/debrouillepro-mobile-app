import { View, Text, Pressable } from "react-native";

// src/features/network/components/Network/NetworkSuggestions.tsx
import { useState } from "react";
import { Sparkles, Users, UserPlus, RefreshCw, X } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatar } from "../Profile/ProfileAvatar";
import { FollowButton } from "@/features/network/components/common/FollowButton";
import type { Id } from "@/convex/_generated/dataModel";

export interface Suggestion {
  _id: Id<"users">;
  name: string;
  avatar?: string | null;
  headline?: string;
  city?: string;
  mutualFollowers?: number;
  isFollowedByMe?: boolean;
  reason?: string;
}

interface NetworkSuggestionsProps {
  suggestions: Suggestion[];
  totalCount: number;
  isLoading?: boolean;
  onUserClick?: (userId: Id<"users">) => void;
  onFollowToggle?: (userId: Id<"users">, isFollowing: boolean) => void;
  onDismiss?: (userId: Id<"users">) => void;
  onRefresh?: () => void;
  className?: string;
  limit?: number;
  title?: string;
  emptyMessage?: string;
}

export function NetworkSuggestions({
  suggestions,
  totalCount,
  isLoading = false,
  onUserClick,
  onFollowToggle,
  onDismiss,
  onRefresh,
  className,
  limit = 5,
  title = "Suggestions pour vous",
  emptyMessage = "Aucune suggestion pour l'instant",
}: NetworkSuggestionsProps) {
  const [showAll, setShowAll] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const displayLimit = showAll
    ? suggestions.length
    : Math.min(suggestions.length, limit);
  const displaySuggestions = suggestions
    .filter((s) => !dismissedIds.has(s._id))
    .slice(0, displayLimit);

  const hasMore = suggestions.length > limit && !showAll;

  const handleDismiss = (userId: Id<"users">) => {
    setDismissedIds((prev) => new Set(prev).add(userId));
    onDismiss?.(userId);
  };

  const handleRefresh = () => {
    setDismissedIds(new Set());
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}>
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </View>
          <Skeleton className="h-6 w-16 rounded-lg" />
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

  if (displaySuggestions.length === 0) {
    return (
      <View
        className={cn(
          "rounded-3xl p-6 text-center",
          "bg-white/5 border border-white/10",
          className,
        )}
      >
        <Users size={32} className="mx-auto mb-3 text-white/20" />
        <Text className="text-white font-semibold text-sm">{emptyMessage}</Text>
        {onRefresh && (
          <Pressable
            onPress={handleRefresh}
            className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400"
          >
            <RefreshCw size={12} />
            <Text>Rafraîchir</Text></Pressable>
        )}
      </View>
    );
  }

  return (
    <View className={cn("space-y-3", className)}>
      {/* Header */}
      <View className="flex items-center justify-between">
        <View className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          <Text className="text-white font-semibold text-sm">{title}</Text>
          <Text className="text-white/30 text-xs">({totalCount})</Text>
        </View>
        {onRefresh && (
          <Pressable
            onPress={handleRefresh}
            className="text-xs text-white/40 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            <Text>Rafraîchir</Text></Pressable>
        )}
      </View>

      {/* Suggestions list */}
      <>
        <View className="space-y-2">
          {displaySuggestions.map((suggestion, index) => (
            <View
              key={suggestion._id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5"
            >
              <Pressable
                onPress={() => onUserClick?.(suggestion._id)}
                className="flex-shrink-0"
              >
                <ProfileAvatar
                  name={suggestion.name}
                  avatar={suggestion.avatar}
                  size="md"
                />
              </Pressable>

              <View className="flex-1 min-w-0">
                <Pressable
                  onPress={() => onUserClick?.(suggestion._id)}
                  className="text-white font-semibold text-sm truncate w-full text-left"
                >
                  {suggestion.name}
                </Pressable>
                {suggestion.headline && (
                  <Text className="text-white/40 text-xs truncate">
                    {suggestion.headline}
                  </Text>
                )}
                <View className="flex items-center gap-2 mt-0.5">
                  {suggestion.city && (
                    <Text className="text-white/25 text-[10px]">
                      {suggestion.city}
                    </Text>
                  )}
                  {suggestion.mutualFollowers !== undefined &&
                    suggestion.mutualFollowers > 0 && (
                      <Text className="text-white/25 text-[10px]">
                        {suggestion.mutualFollowers} <Text>abonnés en commun</Text></Text>
                    )}
                  {suggestion.reason && (
                    <Text className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[9px]">
                      {suggestion.reason}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex items-center gap-1 flex-shrink-0">
                <FollowButton
                  userId={suggestion._id}
                  isFollowing={suggestion.isFollowedByMe ?? false}
                  size="sm"
                  onToggle={(isFollowing) =>
                    onFollowToggle?.(suggestion._id, isFollowing)
                  }
                />
                {onDismiss && (
                  <Pressable
                    onPress={() => handleDismiss(suggestion._id)}
                    className="p-1.5 rounded-lg"
                    title="Ignorer cette suggestion"
                  >
                    <X
                      size={14}
                      className="text-white/30"
                    />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      </>

      {/* Load more */}
      {hasMore && (
        <Pressable
          onPress={() => setShowAll(true)}
          className="w-full py-2 text-sm text-white/40"
        >
          <Text>Voir plus (</Text>{suggestions.length - limit} <Text>autres suggestions)</Text></Pressable>
      )}
    </View>
  );
}
