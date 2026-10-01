import { Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { useChat } from "../hooks/useChat";

import { ChatHeader } from "./ChatHeader";
import { MessagesArea } from "./MessagesArea";
import { MessageComposer } from "./MessageComposer";

interface ChatViewProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;

  onBack?: () => void;
  onInfo?: () => void;

  onCall?: () => void;
  onVideoCall?: () => void;
}

export function ChatView({
  conversationId,
  currentUserId,
  onBack,
  onInfo,
  onCall,
  onVideoCall,
}: ChatViewProps) {
  const chat = useChat(conversationId, currentUserId);

  if (chat.isLoading) {
    return (
      <View
        className="flex-1 min-h-0 h-full overflow-hidden bg-black"
        accessibilityLabel="Chargement de la conversation"
        accessibilityState={{ busy: true }}
      >
        {/* HEADER SKELETON */}
        <View className="shrink-0 border-b border-white/[0.08] bg-black/95 px-3 py-3">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 rounded-full bg-white/[0.06]" />

            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-11 w-11 rounded-full bg-white/[0.07]" />

              <View className="min-w-0 flex-1 gap-2">
                <View className="h-4 w-32 rounded-full bg-white/[0.08]" />
                <View className="h-3 w-20 rounded-full bg-white/[0.05]" />
              </View>
            </View>

            <View className="flex-row items-center gap-1">
              <View className="h-10 w-10 rounded-full bg-white/[0.05]" />
              <View className="h-10 w-10 rounded-full bg-white/[0.05]" />
              <View className="h-10 w-10 rounded-full bg-white/[0.05]" />
            </View>
          </View>
        </View>

        {/* MESSAGE SKELETON */}
        <View className="min-h-0 flex-1 justify-end px-4 py-5">
          <View className="gap-3">
            <View className="self-start rounded-2xl rounded-bl-md bg-white/[0.05] px-5 py-4">
              <View className="h-3 w-36 rounded-full bg-white/[0.06]" />
            </View>

            <View className="self-end rounded-2xl rounded-br-md bg-white/[0.07] px-5 py-4">
              <View className="h-3 w-48 rounded-full bg-white/[0.08]" />
              <View className="mt-2 h-3 w-24 rounded-full bg-white/[0.05]" />
            </View>

            <View className="self-start rounded-2xl rounded-bl-md bg-white/[0.05] px-5 py-4">
              <View className="h-3 w-56 rounded-full bg-white/[0.06]" />
              <View className="mt-2 h-3 w-32 rounded-full bg-white/[0.05]" />
            </View>

            <View className="self-end rounded-2xl rounded-br-md bg-white/[0.07] px-5 py-4">
              <View className="h-3 w-40 rounded-full bg-white/[0.08]" />
            </View>
          </View>
        </View>

        {/* COMPOSER SKELETON */}
        <View className="shrink-0 border-t border-white/[0.08] bg-black px-3 pb-3 pt-2">
          <View className="h-14 rounded-[22px] border border-white/[0.06] bg-white/[0.03]" />
        </View>

        <View className="pointer-events-none absolute inset-0 items-center justify-center">
          <View className="rounded-2xl border border-white/[0.08] bg-black/90 px-5 py-3">
            <Text className="text-sm font-medium text-white/50">
              Chargement de la conversation…
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 min-h-0 h-full overflow-hidden bg-black"
      style={{ height: "100%" }}
      accessibilityLabel={chat.title?.trim() || "Conversation"}
    >
      {/* HEADER */}
      <View className="z-20 shrink-0 border-b border-white/[0.08] bg-black/95">
        <ChatHeader
          conversationId={conversationId}
          title={chat.title}
          avatar={chat.avatar}
          isGroup={chat.conversation?.isGroup ?? false}
          memberCount={chat.conversation?.participants?.length ?? 0}
          onBack={onBack}
          onInfo={onInfo}
          onCall={onCall}
          onVideoCall={onVideoCall}
        />
      </View>

      {/* MESSAGES */}
      <View className="min-h-0 flex-1 bg-black">
        <MessagesArea
          messages={chat.messages}
          currentUserId={currentUserId}
          isLoadingMore={chat.isLoadingMore}
          isDone={chat.isDone}
          onLoadMore={chat.loadMoreMessages}
        />
      </View>

      {/* COMPOSER */}
      <View className="z-20 shrink-0 border-t border-white/[0.08] bg-black">
        <MessageComposer conversationId={conversationId} />
      </View>
    </View>
  );
}

export default ChatView;
