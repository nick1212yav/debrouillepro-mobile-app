import { View, Text } from "react-native";
// src/features/messages/chat/components/ChatView.tsx

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

  // Appels
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

  // ==========================================================================
  // LOADING
  // ==========================================================================

  if (chat.isLoading) {
    return (
      <View
        className="flex h-full min-h-0 flex-col overflow-hidden bg-black text-white"
        accessibilityLabel="Conversation"
      >
        {/* Header skeleton */}

        <View className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] bg-black/80 px-4 py-3">
          <View className="h-9 w-9 animate-pulse rounded-full bg-white/[0.06]" />

          <View className="flex min-w-0 flex-1 items-center gap-3">
            <View className="h-11 w-11 animate-pulse rounded-full bg-white/[0.06]" />

            <View className="space-y-2">
              <View className="h-3 w-28 animate-pulse rounded-full bg-white/[0.08]" />
              <View className="h-2 w-20 animate-pulse rounded-full bg-white/[0.05]" />
            </View>
          </View>

          <View className="flex gap-1">
            <View className="h-9 w-9 animate-pulse rounded-full bg-white/[0.05]" />
            <View className="h-9 w-9 animate-pulse rounded-full bg-white/[0.05]" />
            <View className="h-9 w-9 animate-pulse rounded-full bg-white/[0.05]" />
          </View>
        </View>

        {/* Messages skeleton */}

        <View className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-hidden px-4 py-5">
          <View className="flex justify-start">
            <View className="h-12 w-44 animate-pulse rounded-2xl bg-white/[0.05]" />
          </View>

          <View className="flex justify-end">
            <View className="h-16 w-56 animate-pulse rounded-2xl bg-white/[0.07]" />
          </View>

          <View className="flex justify-start">
            <View className="h-20 w-64 animate-pulse rounded-2xl bg-white/[0.05]" />
          </View>

          <View className="flex justify-end">
            <View className="h-12 w-36 animate-pulse rounded-2xl bg-white/[0.07]" />
          </View>
        </View>

        {/* Composer skeleton */}

        <View className="shrink-0 border-t border-white/[0.08] bg-black px-3 pb-3 pt-2">
          <View className="h-14 animate-pulse rounded-[22px] border border-white/[0.06] bg-white/[0.03]" />
        </View>

        <View className="absolute inset-0 flex items-center justify-center">
          <View className="rounded-2xl border border-white/[0.08] bg-black/80 px-5 py-3 text-sm text-white/40 shadow-2xl">
            <Text>Chargement de la conversation...</Text></View>
        </View>
      </View>
    );
  }

  // ==========================================================================
  // CHAT
  // ==========================================================================

  return (
    <View
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-black text-white"
      accessibilityLabel={chat.title || "Conversation"}
    >
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}

      <View className="relative z-20 shrink-0">
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

      {/* ================================================================== */}
      {/* MESSAGES                                                           */}
      {/* ================================================================== */}

      <View className="relative min-h-0 flex-1 overflow-hidden">
        <MessagesArea
          messages={chat.messages}
          currentUserId={currentUserId}
          isLoadingMore={chat.isLoadingMore}
          isDone={chat.isDone}
          onLoadMore={chat.loadMoreMessages}
        />
      </View>

      {/* ================================================================== */}
      {/* COMPOSER                                                           */}
      {/* ================================================================== */}

      <View className="relative z-20 shrink-0">
        <MessageComposer conversationId={conversationId} />
      </View>

      {/* ================================================================== */}
      {/* CALL / MEDIA / FORWARD OVERLAYS                                    */}
      {/* ================================================================== */}
      {/*
       * Les overlays seront montés ici lorsqu'ils seront raccordés
       * à leurs hooks respectifs :
       *
       * - IncomingCall
       * - OutgoingCall
       * - ActiveCall
       * - MinimizedCall
       * - AttachmentPreview
       * - VoiceRecorder
       * - MediaViewer
       * - ForwardDialog
       *
       * On ne les instancie pas artificiellement ici tant que leurs
       * contrats de props ne sont pas définis dans le projet.
       *
       * ChatView reste ainsi le point central d'orchestration sans
       * casser le typage ou créer de fausses dépendances.
       */}
    </View>
  );
}

export default ChatView;
