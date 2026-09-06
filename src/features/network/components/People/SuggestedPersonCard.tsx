import { View, Text, Pressable } from "react-native";

// src/features/network/components/People/SuggestedPersonCard.tsx
import { MapPin, Users, X, Check } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { FollowButton } from "@/features/network/components/common/FollowButton";
import { NetworkAvatar } from "@/features/network/components/common/NetworkAvatar";
import type { Id } from "@/convex/_generated/dataModel";

interface SuggestedPerson {
  _id: Id<"users">;
  name: string;
  avatar?: string | null;
  headline?: string;
  city?: string;
  country?: string;
  role?: string;
  verified?: boolean;
  followerCount: number;
  isFollowing?: boolean;
  reason?: string;
}

interface SuggestedPersonCardProps {
  person: SuggestedPerson;
  onPress?: () => void;
  onFollowToggle?: () => void;
  onDismiss?: () => void;
  className?: string;
  index?: number;
}

export function SuggestedPersonCard({
  person,
  onPress,
  onFollowToggle,
  onDismiss,
  className,
  index = 0,
}: SuggestedPersonCardProps) {
  const location = person.city
    ? person.country
      ? `${person.city}, ${person.country}`
      : person.city
    : null;

  return (
    <View
      className={cn(
        "relative rounded-2xl p-4",
        "bg-gradient-to-br from-white/8 to-white/4",
        "border border-white/10",
        "hover:border-white/20 transition-all",
        className,
      )}
    >
      {/* Bouton dismiss */}
      {onDismiss && (
        <Pressable
          onPress={(e) => {
            onDismiss();
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-white/5"
        >
          <X size={12} className="text-white/40" />
        </Pressable>
      )}

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
            size="lg"
            verified={person.verified}
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
                                        : "rgba(255,255,255,0.1)", color:
                                    person.role === "entreprise"
                                      ? "#fb923c"
                                      : person.role === "professionnel"
                                        ? "#818cf8"
                                        : "rgba(255,255,255,0.5)" }}
              >
                {person.role === "entreprise"
                  ? "🏢"
                  : person.role === "professionnel"
                    ? "💼"
                    : person.role}
              </Text>
            )}
          </View>

          {person.headline && (
            <Text className="text-white/60 text-xs truncate">{person.headline}</Text>
          )}

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
          </View>

          {person.reason && (
            <Text className="text-indigo-400/60 text-[10px] mt-1 flex items-center gap-1">
              <Text className="w-1 h-1 rounded-full bg-indigo-400/40" />
              {person.reason}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {onFollowToggle && (
            <FollowButton
              userId={person._id}
              isFollowing={person.isFollowing ?? false}
              onToggle={onFollowToggle}
              size="sm"
            />
          )}
        </View>
      </View>
    </View>
  );
}
