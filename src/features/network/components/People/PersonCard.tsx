import { View, Text, Pressable } from "react-native";

// src/features/network/components/People/PersonCard.tsx
import {
  MapPin,
  Briefcase,
  Users,
  Star,
  Check,
  MessageCircle,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { FollowButton } from "@/features/network/components/common/FollowButton";
import { NetworkAvatar } from "@/features/network/components/common/NetworkAvatar";
import type { Id } from "@/convex/_generated/dataModel";

export interface Person {
  _id: Id<"users">;
  name: string;
  avatar?: string | null;
  headline?: string;
  bio?: string;
  city?: string;
  country?: string;
  role?: string;
  verified?: boolean;
  followerCount: number;
  isFollowing?: boolean;
  mutualConnections?: number;
  rating?: number;
  reviewCount?: number;
  skills?: string[];
  online?: boolean;
  lastActive?: string;
}

interface PersonCardProps {
  person: Person;
  variant?: "default" | "suggested" | "compact" | "detailed";
  onPress?: () => void;
  onFollowToggle?: () => void;
  onMessage?: () => void;
  showFollowButton?: boolean;
  showMessageButton?: boolean;
  className?: string;
  index?: number;
}

export function PersonCard({
  person,
  variant = "default",
  onPress,
  onFollowToggle,
  onMessage,
  showFollowButton = true,
  showMessageButton = false,
  className,
  index = 0,
}: PersonCardProps) {
  const isCompact = variant === "compact";
  const isSuggested = variant === "suggested";
  const isDetailed = variant === "detailed";

  const location = person.city
    ? person.country
      ? `${person.city}, ${person.country}`
      : person.city
    : null;

  const cardContent = (
    <>
      <View className="flex items-start gap-3">
        {/* Avatar */}
        <Pressable
          onPress={onPress}
          className="flex-shrink-0"
          disabled={!onPress}
        >
          <NetworkAvatar
            name={person.name}
            avatar={person.avatar}
            size={isCompact ? "md" : isSuggested ? "lg" : "xl"}
            verified={person.verified}
            online={person.online}
          />
        </Pressable>

        {/* Infos */}
        <View className="flex-1 min-w-0">
          <View className="flex items-center gap-1.5">
            <Pressable
              onPress={onPress}
              className="text-white font-semibold text-sm truncate"
              disabled={!onPress}
            >
              {person.name}
            </Pressable>
            {person.verified && (
              <Check size={14} className="text-emerald-400 flex-shrink-0" />
            )}
            {person.role && (
              <Text
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: person.role === "entreprise"
                                      ? "rgba(249,115,22,0.2)"
                                      : person.role === "professionnel"
                                        ? "rgba(99,102,241,0.2)"
                                        : person.role === "artisan"
                                          ? "rgba(236,72,153,0.2)"
                                          : "rgba(255,255,255,0.1)", color:
                                    person.role === "entreprise"
                                      ? "#fb923c"
                                      : person.role === "professionnel"
                                        ? "#818cf8"
                                        : person.role === "artisan"
                                          ? "#f472b6"
                                          : "rgba(255,255,255,0.5)" }}
              >
                {person.role === "entreprise"
                  ? "🏢"
                  : person.role === "professionnel"
                    ? "💼"
                    : person.role === "artisan"
                      ? "🔧"
                      : person.role}
              </Text>
            )}
          </View>

          {person.headline && (
            <Text className="text-white/60 text-xs truncate">{person.headline}</Text>
          )}

          {!isCompact && (
            <View className="flex items-center gap-2 flex-wrap mt-1 text-xs text-white/40">
              {location && (
                <Text className="flex items-center gap-0.5">
                  <MapPin size={10} />
                  {location}
                </Text>
              )}
              {person.followerCount > 0 && (
                <Text className="flex items-center gap-0.5">
                  <Users size={10} />
                  {person.followerCount}
                </Text>
              )}
              {person.mutualConnections && person.mutualConnections > 0 && (
                <Text className="flex items-center gap-0.5">
                  <Users size={10} />
                  {person.mutualConnections} en commun
                </Text>
              )}
              {person.rating && person.rating > 0 && (
                <Text className="flex items-center gap-0.5 text-amber-400">
                  <Star size={10} className="fill-amber-400" />
                  {person.rating.toFixed(1)}
                  {person.reviewCount && person.reviewCount > 0 && (
                    <Text className="text-white/30">
                      ({person.reviewCount})
                    </Text>
                  )}
                </Text>
              )}
            </View>
          )}

          {/* Bio (pour les variétés détaillées) */}
          {isDetailed && person.bio && (
            <Text className="text-white/50 text-xs mt-1">
              {person.bio}
            </Text>
          )}

          {/* Compétences (pour les variétés détaillées) */}
          {isDetailed && person.skills && person.skills.length > 0 && (
            <View className="flex flex-wrap gap-1 mt-1.5">
              {person.skills.slice(0, 3).map((skill) => (
                <Text
                  key={skill}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300"
                >
                  {skill}
                </Text>
              ))}
              {person.skills.length > 3 && (
                <Text className="text-[10px] text-white/30">
                  +{person.skills.length - 3}
                </Text>
              )}
            </View>
          )}

          {/* Dernière activité */}
          {person.lastActive && (
            <Text className="text-white/25 text-[10px] mt-1">
              Actif·ve il y a {new Date(person.lastActive).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {showFollowButton && onFollowToggle && (
            <FollowButton
              userId={person._id}
              isFollowing={person.isFollowing ?? false}
              onToggle={onFollowToggle}
              size="sm"
            />
          )}
          {showMessageButton && onMessage && (
            <Pressable
              onPress={onMessage}
              className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium text-white/60 bg-white/5 border border-white/10"
            >
              <MessageCircle size={12} />
              <Text>Message</Text></Pressable>
          )}
        </View>
      </View>
    </>
  );

  // Rendu selon la variante
  if (isCompact) {
    return (
      <View
        className={cn(
          "rounded-xl p-3",
          "bg-white/5 border border-white/8",
          "hover:bg-white/8 transition-colors",
          className,
        )}
      >
        {cardContent}
      </View>
    );
  }

  return (
    <Pressable
      className={cn(
        "rounded-2xl p-4",
        "bg-white/5 border border-white/10",
        "hover:bg-white/8 transition-colors",
        className,
      )}
      onPress={onPress}
    >
      {cardContent}
    </Pressable>
  );
}
