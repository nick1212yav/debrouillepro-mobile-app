import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";

export default function MessagesIndexScreen() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const conversations = useQuery(api.messages.conversations.list);

  if (currentUser === undefined || conversations === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0D1117]">
        <ActivityIndicator color="#F97316" />
      </View>
    );
  }

  const currentUserId = currentUser?._id;

  return (
    <View className="flex-1 bg-[#0D1117]">
      <View className="flex-row items-center gap-3 px-4 py-4 border-b border-white/5">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-xl bg-white/5 active:bg-white/10"
        >
          <ArrowLeft size={18} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-lg">Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-white/40 text-sm text-center">
            Aucune conversation pour le moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => {
            const otherUser = currentUserId
              ? item.participants.find((p) => p._id !== currentUserId)
              : undefined;

            const title = item.isGroup
              ? (item.groupName ?? "Groupe")
              : (otherUser?.name ?? "Utilisateur");

            const image = item.isGroup ? item.groupAvatar : otherUser?.avatar;

            const unreadCount = currentUserId
              ? (item.members.find((m) => m.userId === currentUserId)
                  ?.unreadCount ?? 0)
              : 0;

            return (
              <Pressable
                onPress={() => router.push(`/messages/${item._id}`)}
                className="flex-row items-center gap-3 rounded-2xl bg-white/5 border border-white/5 p-3 active:bg-white/10"
              >
                {image ? (
                  <Image
                    source={{ uri: image }}
                    className="h-11 w-11 rounded-full"
                  />
                ) : (
                  <View className="h-11 w-11 rounded-full bg-orange-500/20 items-center justify-center">
                    <Text className="text-orange-400 font-bold text-base">
                      {title.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View className="flex-1 min-w-0">
                  <Text
                    className="text-white font-semibold text-sm"
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  <Text
                    className="text-white/50 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {item.lastMessageText ?? "Aucun message"}
                  </Text>
                </View>

                {unreadCount > 0 && (
                  <View className="rounded-full bg-orange-500 px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
