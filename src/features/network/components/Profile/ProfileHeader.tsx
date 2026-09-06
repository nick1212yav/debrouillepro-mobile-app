import { View, Text } from "react-native";

// src/features/network/components/Profile/ProfileHeader.tsx
import { MapPin, ShieldCheck, CalendarDays } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileActions } from "./ProfileActions";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";

interface ProfileHeaderProps {
  userId: Id<"users">;
  name: string;
  avatar?: string | null;
  cover?: string | null;
  headline?: string;
  role?: string;
  city?: string;
  country?: string;
  verified?: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile?: boolean;
  joinedAt?: string;
  onFollowToggle?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ProfileHeader({
  userId,
  name,
  avatar,
  cover,
  headline,
  role,
  city,
  country,
  verified = false,
  followerCount,
  followingCount,
  isFollowing,
  isOwnProfile = false,
  joinedAt,
  onFollowToggle,
  onMessage,
  onShare,
  isLoading = false,
  className,
}: ProfileHeaderProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-4", className)}>
        <View className="flex items-start justify-between gap-3">
          <View className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <View className="space-y-2">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-3 w-32 rounded-lg" />
            </View>
          </View>
          <Skeleton className="h-9 w-24 rounded-2xl" />
        </View>
        <View className="flex gap-4">
          <Skeleton className="h-10 w-16 rounded-xl" />
          <Skeleton className="h-10 w-16 rounded-xl" />
        </View>
      </View>
    );
  }

  const location = city ? (country ? `${city}, ${country}` : city) : null;

  return (
    <View
      className={cn("space-y-4", className)}
    >
      <View className="flex items-start justify-between gap-3">
        <View className="flex items-center gap-4 min-w-0">
          <ProfileAvatar
            name={name}
            avatar={avatar}
            size="xl"
            verified={verified}
            isLoading={isLoading}
          />
          <View className="min-w-0">
            <View className="flex items-center gap-2">
              <Text className="text-white text-xl font-black truncate">{name}</Text>
              {verified && (
                <ShieldCheck
                  size={18}
                  className="text-emerald-400 flex-shrink-0"
                />
              )}
            </View>
            {headline && (
              <Text className="text-indigo-300 text-sm font-semibold truncate">
                {headline}
              </Text>
            )}
            {role && (
              <Text className="text-white/40 text-xs truncate">
                {role === "entreprise"
                  ? "🏢 Entreprise"
                  : role === "professionnel"
                    ? "💼 Professionnel"
                    : role === "artisan"
                      ? "🔧 Artisan"
                      : role === "recruteur"
                        ? "🎯 Recruteur"
                        : role}
              </Text>
            )}
          </View>
        </View>

        <ProfileActions
          userId={userId}
          isFollowing={isFollowing}
          isOwnProfile={isOwnProfile}
          onFollowToggle={onFollowToggle}
          onMessage={onMessage}
          onShare={onShare}
          isLoading={isLoading}
        />
      </View>

      <View className="flex items-center gap-4 flex-wrap">
        {location && (
          <View className="flex items-center gap-1 text-white/40 text-xs">
            <MapPin size={12} />
            {location}
          </View>
        )}
        {joinedAt && (
          <View className="flex items-center gap-1 text-white/40 text-xs">
            <CalendarDays size={12} />
            <Text>Membre depuis</Text>{" "}
            {new Date(joinedAt).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </View>
        )}
      </View>

      <View className="flex gap-5">
        <View>
          <Text className="text-white font-black">{followerCount}</Text>
          <Text className="text-white/35 text-[11px]">Abonnés</Text>
        </View>
        <View>
          <Text className="text-white font-black">{followingCount}</Text>
          <Text className="text-white/35 text-[11px]"><Text>Abonnements</Text></Text>
        </View>
      </View>
    </View>
  );
}
