// src/features/profile/components/FollowButton.tsx

import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useMutation } from "convex/react";
import { UserCheck, UserPlus } from "lucide-react-native";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";

interface FollowButtonProps {
  userId: Id<"users">;
  isFollowing: boolean;
}

export function FollowButton({ userId, isFollowing }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);

  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handlePress = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const following = await toggleFollow({
        targetUserId: userId,
      });

      toast.success(following ? "Abonnement confirmé" : "Abonnement retiré");
    } catch (error) {
      console.error("Failed to toggle follow relationship:", error);

      toast.error("Impossible de modifier l’abonnement");
    } finally {
      setLoading(false);
    }
  };

  const active = isFollowing;

  return (
    <Pressable
      onPress={() => {
        void handlePress();
      }}
      disabled={loading}
      accessibilityRole="button"
      accessibilityState={{
        disabled: loading,
        selected: active,
      }}
      accessibilityLabel={
        active ? "Ne plus suivre cet utilisateur" : "Suivre cet utilisateur"
      }
      style={({ pressed }) => ({
        minHeight: 44,
        minWidth: 112,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: active
          ? "rgba(255,255,255,0.12)"
          : "rgba(99,102,241,0.45)",
        backgroundColor: active
          ? "rgba(255,255,255,0.05)"
          : "rgba(99,102,241,0.16)",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        opacity: loading ? 0.65 : pressed ? 0.78 : 1,
      })}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" />

          <Text className="ml-2 text-xs font-bold text-white/80">
            Traitement…
          </Text>
        </>
      ) : active ? (
        <>
          <UserCheck
            size={16}
            color="rgba(255,255,255,0.75)"
            strokeWidth={2.2}
          />

          <Text className="ml-2 text-xs font-bold text-white/75">Abonné</Text>
        </>
      ) : (
        <>
          <UserPlus size={16} color="#ffffff" strokeWidth={2.2} />

          <Text className="ml-2 text-xs font-bold text-white">Suivre</Text>
        </>
      )}
    </Pressable>
  );
}
