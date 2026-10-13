import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";
import { ChatView } from "@/features/messages/chat/components/ChatView";

export default function ConversationScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();

  const currentUser = useQuery(api.users.getCurrentUser);
  const conversation = useQuery(
    api.messages.conversations.get,
    conversationId
      ? { conversationId: conversationId as Id<"conversations"> }
      : "skip",
  );

  if (!conversationId) {
    return (
      <View className="flex-1 bg-[#0D1117] items-center justify-center">
        <Text className="text-white/50 text-sm">Conversation invalide.</Text>
      </View>
    );
  }

  if (conversation === undefined || currentUser === undefined) {
    return (
      <View className="flex-1 bg-[#0D1117] items-center justify-center">
        <ActivityIndicator color="#F97316" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View className="flex-1 bg-[#0D1117] items-center justify-center p-6">
        <Text className="text-white/60 text-sm text-center">
          Connecte-toi pour ouvrir cette conversation.
        </Text>
      </View>
    );
  }

  const otherUser = conversation.participants.find(
    (p) => p._id !== currentUser._id,
  );

  const title = conversation.isGroup
    ? (conversation.groupName ?? "Groupe")
    : (otherUser?.name ?? "Conversation");

  return (
    <View className="flex-1 bg-[#0D1117]">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-white/5">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-xl bg-white/5 active:bg-white/10"
        >
          <ArrowLeft size={18} color="white" />
        </Pressable>
        <Text className="text-white font-bold text-base" numberOfLines={1}>
          {title}
        </Text>
      </View>

      <ChatView
        conversationId={conversationId as Id<"conversations">}
        currentUserId={currentUser._id}
        onBack={() => router.back()}
      />
    </View>
  );
}
