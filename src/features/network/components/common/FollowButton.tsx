import { Pressable } from "react-native";

// src/features/network/components/common/FollowButton.tsx
import { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: Id<"users">;
  isFollowing: boolean;
  onToggle?: (isFollowing: boolean) => void;
  size?: "sm" | "default";
  className?: string;
}

export function FollowButton({
  userId,
  isFollowing: initialFollowing,
  onToggle,
  size = "default",
  className,
}: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);

  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const result = await toggleFollow({
        targetUserId: userId,
      });

      setIsFollowing(result);
      onToggle?.(result);
      toast.success(result ? "Abonnement confirmé" : "Abonnement retiré");
    } catch {
      toast.error("Impossible de modifier l'abonnement");
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-xs rounded-xl gap-1.5"
      : "px-5 py-2.5 text-sm rounded-2xl gap-2";

  return (
    <Pressable onPress={() => void handleClick()} disabled={loading} className={cn(
        "flex items-center justify-center font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50",
        sizeClasses,
        isFollowing
          ? "bg-white/10 text-white/70 border border-white/10 hover:bg-white/15"
          : "text-white border-none",
        className,
      )} style={
        isFollowing
          ? undefined
          : { boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }
      }>
      {loading ? (
        <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck size={size === "sm" ? 14 : 16} />
          Abonné
        </>
      ) : (
        <>
          <UserPlus size={size === "sm" ? 14 : 16} />
          Suivre
        </>
      )}
    </Pressable>
  );
}
