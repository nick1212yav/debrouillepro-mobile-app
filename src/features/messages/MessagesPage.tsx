import { View, Pressable, Text } from "react-native";

// src/features/messages/MessagesPage.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useMessagesFeature } from "./hooks/useMessagesFeature";
import { useConversations } from "./conversations/hooks/useConversations";

import { ConversationList } from "./conversations/components/ConversationList";
import { ConversationSearch } from "./conversations/components/ConversationSearch";
import { EmptyConversations } from "./conversations/components/EmptyConversations";
import { NewConversation } from "./conversations/components/NewConversation";

import { ChatView } from "./chat/components/ChatView";

import { LoadingState } from "./shared/components/LoadingState";
import { ErrorState } from "./shared/components/ErrorState";

import type { ConversationPreview } from "./conversations/services/conversations.service";

// ============================================================================
// TYPES
// ============================================================================

type ConversationId = Id<"conversations">;

type UserId = Id<"users">;

type MessagesPageProps = {
  initialConversationId?: ConversationId;
  className?: string;
  onBack?: () => void;
};

// ============================================================================
// PAGE
// ============================================================================

export default function MessagesPage({
  initialConversationId,
  className = "",
  onBack,
}: MessagesPageProps) {
  // ==========================================================================
  // CURRENT USER
  // ==========================================================================

  const currentUser = useCurrentUser();

  const currentUserId: UserId | null = currentUser?._id ?? null;

  // ==========================================================================
  // CONVERSATIONS
  // ==========================================================================

  const {
    previews,
    unreadCount,
    isLoading: conversationsLoading,
  } = useConversations(currentUserId);

  // ==========================================================================
  // USERS FOR NEW CONVERSATION
  // ==========================================================================

  const users = useQuery(
    api.users.listForMessaging,
    currentUserId ? {} : "skip",
  );

  // ==========================================================================
  // FEATURE STATE
  // ==========================================================================

  const feature = useMessagesFeature();

  const { activeConversationId, actions } = feature;

  // ==========================================================================
  // UI STATE
  // ==========================================================================

  const [mobilePanel, setMobilePanel] = useState<"conversations" | "chat">(
    initialConversationId ? "chat" : "conversations",
  );

  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  // ==========================================================================
  // DERIVED STATE
  // ==========================================================================

  const selectedConversationId =
    activeConversationId ?? initialConversationId ?? null;

  const isLoadingCurrentUser = currentUser === undefined;

  const isLoadingUsers = currentUserId !== null && users === undefined;

  const isLoading = conversationsLoading || isLoadingCurrentUser;

  const activeConversation = useMemo<ConversationPreview | null>(() => {
    if (!selectedConversationId) {
      return null;
    }

    return (
      previews.find(
        (conversation) =>
          conversation.conversationId === selectedConversationId,
      ) ?? null
    );
  }, [previews, selectedConversationId]);

  // ==========================================================================
  // ROOT CLASS
  // ==========================================================================

  const rootClassName = useMemo(
    () =>
      [
        "messages-page",
        "flex",
        "h-full",
        "min-h-0",
        "w-full",
        "overflow-hidden",
        "bg-background",
        className,
      ]
        .filter(Boolean)
        .join(" "),
    [className],
  );

  // ==========================================================================
  // SELECT CONVERSATION
  // ==========================================================================

  const handleSelectConversation = useCallback(
    (conversationId: ConversationId) => {
      actions.openConversation(conversationId);
      setMobilePanel("chat");
    },
    [actions],
  );

  // ==========================================================================
  // SELECT FROM SEARCH
  // ==========================================================================

  const handleSearchSelect = useCallback(
    (conversation: ConversationPreview) => {
      handleSelectConversation(conversation.conversationId);
    },
    [handleSelectConversation],
  );

  // ==========================================================================
  // INITIAL CONVERSATION
  // ==========================================================================

  useEffect(() => {
    if (!initialConversationId) {
      return;
    }

    if (activeConversationId === initialConversationId) {
      return;
    }

    actions.openConversation(initialConversationId);
    setMobilePanel("chat");
  }, [initialConversationId, activeConversationId, actions]);

  // ==========================================================================
  // BACK TO CONVERSATIONS
  // ==========================================================================

  const handleBackToConversations = useCallback(() => {
    setMobilePanel("conversations");
  }, []);

  // ==========================================================================
  // CLOSE CONVERSATION
  // ==========================================================================

  const handleCloseConversation = useCallback(() => {
    actions.closeConversation();
    setMobilePanel("conversations");
  }, [actions]);

  // ==========================================================================
  // NEW CONVERSATION
  // ==========================================================================

  const handleNewConversation = useCallback(() => {
    setIsNewConversationOpen(true);
  }, []);

  const handleCloseNewConversation = useCallback(() => {
    setIsNewConversationOpen(false);
  }, []);

  // ==========================================================================
  // CONVERSATION CREATED
  // ==========================================================================

  const handleConversationCreated = useCallback(
    (conversationId: ConversationId) => {
      setIsNewConversationOpen(false);
      handleSelectConversation(conversationId);
    },
    [handleSelectConversation],
  );

  // ==========================================================================
  // LOADING
  // ==========================================================================

  if (isLoading) {
    return (
      <View className={rootClassName} accessibilityLabel="Messagerie"><View className="flex h-full w-full items-center justify-center"><LoadingState /></View></View>
    );
  }

  // ==========================================================================
  // AUTHENTICATION SAFETY
  // ==========================================================================

  if (!currentUserId) {
    return (
      <View className={rootClassName} accessibilityLabel="Messagerie"><View className="flex h-full w-full items-center justify-center p-6"><ErrorState /></View></View>
    );
  }

  // ==========================================================================
  // UI
  // ==========================================================================

  return (
    <>
      <View className={rootClassName} accessibilityLabel="Messagerie">{}<View className={[
            "flex",
            "h-full",
            "min-h-0",
            "w-full",
            "shrink-0",
            "flex-col",
            "border-r",
            "border-white/10",
            "bg-background",
            "md:w-[340px]",
            "lg:w-[380px]",
            "xl:w-[400px]",
            mobilePanel === "chat" ? "hidden md:flex" : "flex",
          ].join(" ")} accessibilityLabel="Conversations">{}<View className="flex items-center justify-between gap-3 px-4 py-4"><View className="flex min-w-0 items-center gap-3">{onBack && (
                <Pressable onPress={onBack} className={[
                    "inline-flex",
                    "h-10",
                    "w-10",
                    "shrink-0",
                    "items-center",
                    "justify-center",
                    "rounded-full",
                    "border",
                    "border-white/10",
                    "bg-white/[0.04]",
                    "text-white/70",
                    "transition-all",
                    "duration-200",
                    "hover:bg-white/10",
                    "hover:text-white",
                    "active:scale-95",
                    "focus:outline-none",
                    "focus:ring-2",
                    "focus:ring-primary",
                    "focus:ring-offset-2",
                  ].join(" ")} accessibilityLabel="Retour"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" /></svg></Pressable>
              )}<View className="min-w-0"><View className="flex items-center gap-2"><Text className="truncate text-xl font-semibold tracking-tight text-white">Messages
                  </Text>{previews.length > 0 && (
                    <Text className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/50">{previews.length}</Text>
                  )}</View><Text className="mt-0.5 text-sm text-white/40">Vos conversations
                </Text></View></View><Pressable onPress={handleNewConversation} className={[
                "inline-flex",
                "h-10",
                "w-10",
                "shrink-0",
                "items-center",
                "justify-center",
                "rounded-full",
                "bg-primary",
                "text-primary-foreground",
                "shadow-lg",
                "transition-all",
                "duration-200",
                "hover:scale-105",
                "hover:opacity-90",
                "active:scale-95",
                "focus:outline-none",
                "focus:ring-2",
                "focus:ring-primary",
                "focus:ring-offset-2",
              ].join(" ")} accessibilityLabel="Nouvelle conversation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants"><path strokeLinecap="round" d="M12 5v14" /><path strokeLinecap="round" d="M5 12h14" /></svg></Pressable>{}<View className="px-3 pb-3"><ConversationSearch conversations={previews} onSelect={handleSearchSelect} /></View></View>{}<View className="min-h-0 flex-1 overflow-y-auto px-2 py-2">{previews.length > 0 ? (
              <ConversationList
                conversations={previews}
                currentConversationId={selectedConversationId}
                onSelect={handleSelectConversation}
              />
            ) : (
              <View className="flex h-full items-center justify-center px-4"><EmptyConversations onNewConversation={handleNewConversation} /></View>
            )}</View>{}<View className="hidden shrink-0 border-t border-white/10 px-4 py-3 md:block"><View className="flex items-center justify-between"><Text className="text-xs text-white/30">Messagerie DébrouillePro
              </Text><Text className="flex items-center gap-1.5 text-[11px] text-white/30"><Text className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Connecté
              </Text></View></View></View>{}<View className={[
            "h-full",
            "min-h-0",
            "min-w-0",
            "flex-1",
            "bg-black",
            mobilePanel === "conversations" ? "hidden md:flex" : "flex",
          ].join(" ")} accessibilityLabel={activeConversation
              ? `Conversation avec ${activeConversation.title}`
              : "Conversation"}>{selectedConversationId ? (
            <ChatView
              conversationId={selectedConversationId}
              currentUserId={currentUserId}
              onBack={handleBackToConversations}
              onInfo={handleCloseConversation}
            />
          ) : (
            <View className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black p-6">{}<View className="pointer-events-none absolute inset-0 opacity-40" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants"><View className="absolute left-[15%] top-[20%] h-64 w-64 rounded-full bg-primary/10 blur-3xl" /><View className="absolute bottom-[10%] right-[15%] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" /></View>{}<View className="relative z-10 mx-auto max-w-lg text-center">{}<View className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl"><View className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-8 w-8 text-primary" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-1.1 4.15A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-4.15-1.1L3 21l2.1-5.35A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 1 1 21 11.5Z" /></svg></View></View>{}<View className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/50 backdrop-blur"><Text className="h-1.5 w-1.5 rounded-full bg-primary" /><Text>Messagerie DébrouillePro</Text></View>{}<Text className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Vos messages
                </Text>{}<Text className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/40">Sélectionnez une conversation pour commencer à échanger.
                  <br />Texte, médias, vocaux, appels, réactions et bien plus encore.
                </Text>{}<Pressable onPress={handleNewConversation} className={[
                    "mt-7",
                    "inline-flex",
                    "items-center",
                    "gap-2",
                    "rounded-xl",
                    "bg-primary",
                    "px-5",
                    "py-3",
                    "text-sm",
                    "font-semibold",
                    "text-primary-foreground",
                    "shadow-xl",
                    "transition-all",
                    "duration-200",
                    "hover:scale-[1.02]",
                    "hover:opacity-90",
                    "active:scale-[0.98]",
                    "focus:outline-none",
                    "focus:ring-2",
                    "focus:ring-primary",
                    "focus:ring-offset-2",
                  ].join(" ")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants"><path strokeLinecap="round" d="M12 5v14" /><path strokeLinecap="round" d="M5 12h14" /></svg><Text>Nouvelle conversation</Text></Pressable>{}<View className="mx-auto mt-10 flex max-w-md flex-wrap items-center justify-center gap-2">{["💬 Messages", "🎤 Vocaux", "📎 Médias", "📞 Appels"].map(
                    (featureLabel) => (
                      <Text key={featureLabel} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/30">{featureLabel}</Text>
                    ),
                  )}</View></View></View>
          )}</View></View>

      {/* =====================================================================
          NEW CONVERSATION MODAL
          ===================================================================== */}

      {isNewConversationOpen && (
        <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" accessibilityRole="none"><View className={[
              "w-full",
              "max-w-lg",
              "overflow-hidden",
              "rounded-2xl",
              "border",
              "border-white/10",
              "bg-background",
              "shadow-2xl",
            ].join(" ")} accessibilityRole="dialog" accessibilityViewIsModal={true} accessibilityLabel="Nouvelle conversation">{}<View className="flex items-center justify-between border-b border-white/10 px-5 py-4"><View className="min-w-0"><Text className="text-lg font-semibold text-white">Nouvelle conversation
                </Text><Text className="mt-0.5 text-sm text-white/40">Choisissez une personne avec qui discuter.
                </Text></View><Pressable onPress={handleCloseNewConversation} className={[
                  "inline-flex",
                  "h-9",
                  "w-9",
                  "shrink-0",
                  "items-center",
                  "justify-center",
                  "rounded-full",
                  "text-white/40",
                  "transition",
                  "hover:bg-white/10",
                  "hover:text-white",
                  "focus:outline-none",
                  "focus:ring-2",
                  "focus:ring-primary",
                ].join(" ")} accessibilityLabel="Fermer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" accessibilityElementsHidden={true} importantForAccessibility="no-hide-descendants"><path strokeLinecap="round" d="M6 6l12 12" /><path strokeLinecap="round" d="M18 6 6 18" /></svg></Pressable></View>{}<View className="max-h-[70vh] overflow-y-auto p-5">{isLoadingUsers ? (
                <View className="flex min-h-40 items-center justify-center">
                  <LoadingState />
                </View>
              ) : (
                <NewConversation
                  users={users ?? []}
                  onCreated={handleConversationCreated}
                />
              )}</View></View></View>
      )}
    </>
  );
}
