import { Pressable, View } from "react-native";

// src/features/network/components/Profile/ProfileActions.tsx
import {
  UserPlus,
  UserCheck,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Edit3,
  Settings,
  Bell,
  BellOff,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";

interface ProfileActionsProps {
  userId: Id<"users">;
  isFollowing: boolean;
  isOwnProfile?: boolean;
  isNotified?: boolean;
  onFollowToggle?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
  onNotifyToggle?: () => void;
  isLoading?: boolean;
  className?: string;
  size?: "sm" | "default";
}

export function ProfileActions({
  userId,
  isFollowing,
  isOwnProfile = false,
  isNotified = false,
  onFollowToggle,
  onMessage,
  onShare,
  onEdit,
  onSettings,
  onNotifyToggle,
  isLoading = false,
  className,
  size = "default",
}: ProfileActionsProps) {
  if (isLoading) {
    return (
      <View className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-9 w-24 rounded-2xl" />
        <Skeleton className="h-9 w-9 rounded-2xl" />
        <Skeleton className="h-9 w-9 rounded-2xl" />
      </View>
    );
  }

  const buttonSize =
    size === "sm" ? "text-xs px-3 py-1.5" : "text-sm px-5 py-2.5";
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <View initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={cn("flex items-center gap-2", className)}>
      {/* Bouton Suivre / Abonné */}
      {!isOwnProfile && onFollowToggle && (
        <Pressable onPress={onFollowToggle} className={cn(
            "flex items-center gap-1.5 rounded-2xl font-bold transition-all active:scale-95 cursor-pointer",
            buttonSize,
            isFollowing
              ? "bg-white/10 text-white/70 border border-white/10 hover:bg-white/15"
              : "text-white",
          )} style={
            isFollowing
              ? undefined
              : { boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }
          }>
          {isFollowing ? (
            <>
              <UserCheck size={iconSize} />
              Abonné
            </>
          ) : (
            <>
              <UserPlus size={iconSize} />
              Suivre
            </>
          )}
        </Pressable>
      )}

      {/* Bouton Message */}
      {!isOwnProfile && onMessage && (
        <Pressable onPress={onMessage} className={cn(
            "flex items-center gap-1.5 rounded-2xl font-bold transition-colors hover:bg-white/15",
            "bg-white/8 border border-white/10 text-white",
            buttonSize,
          )}>
          <MessageSquare size={iconSize} />
          {size === "default" && "Message"}
        </Pressable>
      )}

      {/* Bouton Éditer (profil propriétaire) */}
      {isOwnProfile && onEdit && (
        <Pressable onPress={onEdit} className={cn(
            "flex items-center gap-1.5 rounded-2xl font-bold transition-colors hover:bg-white/15",
            "bg-white/8 border border-white/10 text-white",
            buttonSize,
          )}>
          <Edit3 size={iconSize} />
          {size === "default" && "Éditer"}
        </Pressable>
      )}

      {/* Bouton Paramètres (profil propriétaire) */}
      {isOwnProfile && onSettings && (
        <Pressable onPress={onSettings} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/10 transition-colors" style={{
            width: size === "sm" ? 36 : 40,
            height: size === "sm" ? 36 : 40,
          }}>
          <Settings size={iconSize} className="text-white/70" />
        </Pressable>
      )}

      {/* Bouton Notifications */}
      {!isOwnProfile && onNotifyToggle && (
        <Pressable onPress={onNotifyToggle} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/10 transition-colors" style={{
            width: size === "sm" ? 36 : 40,
            height: size === "sm" ? 36 : 40,
          }} title={
            isNotified
              ? "Désactiver les notifications"
              : "Activer les notifications"
          }>
          {isNotified ? (
            <BellOff size={iconSize} className="text-white/70" />
          ) : (
            <Bell size={iconSize} className="text-white/70" />
          )}
        </Pressable>
      )}

      {/* Bouton Partager */}
      {onShare && (
        <Pressable onPress={onShare} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/10 transition-colors" style={{
            width: size === "sm" ? 36 : 40,
            height: size === "sm" ? 36 : 40,
          }}>
          <Share2 size={iconSize} className="text-white/70" />
        </Pressable>
      )}

      {/* Bouton Plus */}
      <Pressable className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/10 transition-colors" style={{
          width: size === "sm" ? 36 : 40,
          height: size === "sm" ? 36 : 40,
        }}>
        <MoreHorizontal size={iconSize} className="text-white/70" />
      </Pressable>
    </View>
  );
}
