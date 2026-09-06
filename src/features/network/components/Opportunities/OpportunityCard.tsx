import { View, Text, Pressable } from "react-native";

// src/features/network/components/Opportunities/OpportunityCard.tsx
import {
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Users,
  Check,
  ExternalLink,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatar } from "../Profile/ProfileAvatar";
import type { Id } from "@/convex/_generated/dataModel";

export interface OpportunityCardProps {
  id: string;
  title: string;
  subtitle?: string;
  subtitleIcon?: React.ElementType;
  location?: string;
  type?: string;
  typeColor?: string;
  price?: string;
  tags?: string[];
  matchScore?: number;
  matchReasons?: string[];
  postedAt?: string;
  deadline?: string;
  isActive?: boolean;
  isHighlighted?: boolean;
  avatar?: string | null;
  avatarLabel?: string;
  actions?: Array<{
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    disabled?: boolean;
    primary?: boolean;
  }>;
  onViewCompany?: () => void;
  stats?: Array<{
    label: string;
    value: string | number;
    icon: React.ElementType;
  }>;
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function OpportunityCard({
  id,
  title,
  subtitle,
  subtitleIcon: SubtitleIcon,
  location,
  type,
  typeColor = "#6366F1",
  price,
  tags = [],
  matchScore,
  matchReasons = [],
  postedAt,
  deadline,
  isActive = true,
  isHighlighted = false,
  avatar,
  avatarLabel,
  actions = [],
  onViewCompany,
  stats,
  onClick,
  className,
  isLoading = false,
}: OpportunityCardProps) {
  if (isLoading) {
    return (
      <View
        className={cn(
          "p-4 rounded-2xl bg-white/5 border border-white/10",
          className,
        )}
      >
        <View className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
          <View className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-lg" />
            <View className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <Pressable
      className={cn(
        "p-4 rounded-2xl cursor-pointer transition-all",
        "bg-white/5 border border-white/10",
        "hover:bg-white/10 hover:border-white/20",
        isHighlighted && "border-indigo-500/30 bg-indigo-500/5",
        !isActive && "opacity-60",
        className,
      )}
      onPress={onClick}
    >
      <View className="flex items-start gap-3">
        {/* Avatar / Icon */}
        {avatarLabel && (
          <View className="flex-shrink-0">
            <ProfileAvatar name={avatarLabel} avatar={avatar} size="lg" />
          </View>
        )}

        <View className="flex-1 min-w-0 space-y-1.5">
          {/* Title */}
          <Text className="text-white font-semibold text-sm truncate">{title}</Text>

          {/* Subtitle */}
          {subtitle && (
            <View className="flex items-center gap-1.5 text-white/50 text-xs">
              {SubtitleIcon && <SubtitleIcon size={12} />}
              <Text className="truncate">{subtitle}</Text>
              {onViewCompany && (
                <Pressable
                  onPress={(e) => {
                    onViewCompany();
                  }}
                  className="text-indigo-400 flex items-center gap-0.5 text-[10px]"
                >
                  <Text>Voir</Text><ExternalLink size={10} />
                </Pressable>
              )}
            </View>
          )}

          {/* Tags / Type */}
          <View className="flex flex-wrap items-center gap-1.5">
            {type && (
              <Text
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
              >
                {type}
              </Text>
            )}
            {tags.map((tag) => (
              <Text
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60"
              >
                {tag}
              </Text>
            ))}
          </View>

          {/* Location & Price */}
          <View className="flex flex-wrap items-center gap-3 text-xs text-white/40">
            {location && (
              <Text className="flex items-center gap-1">
                <MapPin size={11} />
                {location}
              </Text>
            )}
            {price && (
              <Text className="flex items-center gap-1 text-emerald-400 font-semibold">
                {price}
              </Text>
            )}
            {postedAt && (
              <Text className="flex items-center gap-1">
                <Clock size={11} />
                {getTimeAgo(postedAt)}
              </Text>
            )}
            {deadline && (
              <Text className="flex items-center gap-1 text-amber-400">
                <Calendar size={11} />
                Jusqu'au{" "}
                {new Date(deadline).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            )}
            {!isActive && (
              <Text className="text-red-400 font-medium">Expiré</Text>
            )}
          </View>

          {/* Stats */}
          {stats && stats.length > 0 && (
            <View className="flex flex-wrap items-center gap-3 text-[10px] text-white/30">
              {stats.map((stat) => (
                <Text key={stat.label} className="flex items-center gap-1">
                  <stat.icon size={10} />
                  {stat.value} {stat.label}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Match score */}
        {matchScore !== undefined && (
          <View className="flex-shrink-0 text-right">
            <View
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: `${getMatchColor(matchScore)}20` }}
            >
              <TrendingUp size={10} />
              {matchScore}<Text>%</Text></View>
            {matchReasons.length > 0 && (
              <View className="mt-1 text-[9px] text-white/30 truncate max-w-[120px]">
                {matchReasons[0]}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Match reasons (expandable) */}
      {matchReasons.length > 1 && (
        <View className="mt-2 flex flex-wrap gap-1.5">
          {matchReasons.slice(1).map((reason, i) => (
            <Text
              key={i}
              className="text-[9px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded"
            >
              {reason}
            </Text>
          ))}
        </View>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <View className="mt-3 flex items-center gap-2 flex-wrap border-t border-white/5 pt-3">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={i}
                onPress={(e) => {
                  action.onClick();
                }}
                disabled={action.disabled}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                  action.primary
                    ? "text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50"
                    : "text-white/60 bg-white/5 hover:bg-white/10 disabled:opacity-40",
                )}
              >
                <Icon size={12} />
                {action.label}
              </Pressable>
            );
          })}
        </View>
      )}
    </Pressable>
  );
}
