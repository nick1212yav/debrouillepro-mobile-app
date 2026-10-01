import { useQuery } from "convex/react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Users, X } from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";

import { Avatar } from "./Avatar";

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

  const data = type === "followers" ? followers : following;
  const isLoading = data === undefined;
  const list = data ?? [];

  const title = type === "followers" ? "Abonnés" : "Abonnements";

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/75">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onClose}
          className="absolute inset-0"
        />

        <View
          className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#0A0A14]"
          style={{
            maxHeight: "72%",
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15">
                <Users size={17} color="#818CF8" strokeWidth={2} />
              </View>

              <View>
                <Text className="text-base font-bold text-white">{title}</Text>

                {!isLoading && (
                  <Text className="mt-0.5 text-xs text-white/40">
                    {list.length}{" "}
                    {list.length === 1 ? "utilisateur" : "utilisateurs"}
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer la liste"
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
            >
              <X size={18} color="rgba(255,255,255,0.65)" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 28,
            }}
          >
            {isLoading ? (
              <LoadingState />
            ) : list.length === 0 ? (
              <EmptyState type={type} />
            ) : (
              <View>
                {list.map((user) => (
                  <View
                    key={user._id}
                    className="mb-3 flex-row items-center rounded-2xl border border-white/5 bg-white/[0.025] px-3 py-3"
                  >
                    <Avatar name={user.name} avatar={user.avatar} size={44} />

                    <View className="ml-3 flex-1">
                      <Text
                        className="text-sm font-semibold text-white"
                        numberOfLines={1}
                      >
                        {user.name?.trim() || "Utilisateur"}
                      </Text>

                      {user.bio?.trim() ? (
                        <Text
                          className="mt-1 text-xs text-white/40"
                          numberOfLines={2}
                        >
                          {user.bio}
                        </Text>
                      ) : user.city?.trim() || user.country?.trim() ? (
                        <Text
                          className="mt-1 text-xs text-white/35"
                          numberOfLines={1}
                        >
                          {[user.city?.trim(), user.country?.trim()]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function LoadingState() {
  return (
    <View className="items-center justify-center py-12">
      <ActivityIndicator size="small" color="#818CF8" />

      <Text className="mt-3 text-xs text-white/40">Chargement…</Text>
    </View>
  );
}

function EmptyState({ type }: { type: "followers" | "following" }) {
  const isFollowers = type === "followers";

  return (
    <View className="items-center justify-center px-6 py-12">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
        <Users size={24} color="rgba(255,255,255,0.35)" strokeWidth={1.8} />
      </View>

      <Text className="text-center text-sm font-semibold text-white/80">
        {isFollowers ? "Aucun abonné" : "Aucun abonnement"}
      </Text>

      <Text className="mt-2 text-center text-xs leading-5 text-white/35">
        {isFollowers
          ? "Les personnes qui suivront ce profil apparaîtront ici."
          : "Les profils suivis par cet utilisateur apparaîtront ici."}
      </Text>
    </View>
  );
}
