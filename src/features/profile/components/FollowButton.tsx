import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View } from "react-native";

// src/features/profile/components/FollowButton.tsx

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { UserPlus, UserCheck } from "lucide-react-native";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

interface FollowButtonProps {
  userId: Id<"users">;
  isFollowing: boolean;
}

export function FollowButton({ userId, isFollowing }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handleClick = async () => {
    setLoading(true);
    try {
      const now = await toggleFollow({ targetUserId: userId });
      UIService.openToast(now ? "Abonnement confirmé" : "Abonnement retiré", "info");
    } catch {
      UIService.openToast("Impossible de modifier l'abonnement", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={() => void handleClick()}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95 cursor-pointer",
        isFollowing ? "text-white/70" : "text-white",
      )}
      style={{ borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}
    >
      {loading ? (
        <View className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck size={15} /> Abonné
        </>
      ) : (
        <>
          <UserPlus size={15} /> Suivre
        </>
      )}
    </Pressable>
  );
}
