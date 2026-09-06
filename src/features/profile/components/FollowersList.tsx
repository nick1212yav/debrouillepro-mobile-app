import { View, Text, Pressable } from "react-native";

// src/features/profile/components/FollowersList.tsx

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Users } from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "./Avatar";
import type { Id } from "@/convex/_generated/dataModel";

interface FollowersListProps {
  userId: Id<"users">;
  type: "followers" | "following";
  onClose: () => void;
}

export function FollowersList({ userId, type, onClose }: FollowersListProps) {
  const followers = useQuery(
    api.follows.getFollowers,
    type === "followers" ? { userId } : "skip",
  );
  const following = useQuery(
    api.follows.getFollowing,
    type === "following" ? { userId } : "skip",
  );
  const list = (type === "followers" ? followers : following) ?? [];

  return (
    <Pressable
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onPress={(e) => e.target === e.currentTarget && onClose()}
    >
      <View
        className="w-full rounded-t-3xl max-h-[70vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: "rgba(10,10,20,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <Text className="text-white font-bold flex items-center gap-2">
            <Users size={16} className="text-indigo-400" />
            {type === "followers" ? "Abonnés" : "Abonnements"}
            <Text className="text-white/40 font-normal text-sm">
              ({list.length})
            </Text>
          </Text>
          <Pressable
            onPress={onClose}
            className="text-white/40"
          >
            <Text>✕</Text></Pressable>
        </View>
        <View
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          style={{  }}
        >
          {!followers && !following ? (
            <View className="space-y-3">
              {[0, 1, 2].map((i) => (
                <View key={i} className="flex items-center gap-3 animate-pulse">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-4 w-32 rounded-xl" />
                </View>
              ))}
            </View>
          ) : list.length === 0 ? (
            <Text className="text-white/30 text-sm text-center py-8">
              Aucun utilisateur
            </Text>
          ) : (
            list.filter(Boolean).map(
              (user) =>
                user && (
                  <View key={user._id} className="flex items-center gap-3">
                    <Avatar name={user.name} avatar={user.avatar} size={40} />
                    <View className="flex-1 min-w-0">
                      <Text className="text-white text-sm font-semibold truncate">
                        {user.name ?? "Utilisateur"}
                      </Text>
                      {user.bio && (
                        <Text className="text-white/35 text-xs truncate">
                          {user.bio}
                        </Text>
                      )}
                    </View>
                  </View>
                ),
            )
          )}
        </View>
      </View>
    </Pressable>
  );
}
