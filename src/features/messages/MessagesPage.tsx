// src/features/messages/MessagesPage.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { ArrowLeft, MessageCircle, Plus, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { useCurrentUser } from "@/hooks/use-current-user";

import { useMessagesFeature } from "./hooks/useMessagesFeature";
import { useConversations } from "./conversations/hooks/useConversations";
import { usePresence } from "./presence/hooks/usePresence";

import { ConversationList } from "./conversations/components/ConversationList";
import { ConversationSearch } from "./conversations/components/ConversationSearch";
import { EmptyConversations } from "./conversations/components/EmptyConversations";
import { NewConversation } from "./conversations/components/NewConversation";

import { ChatView } from "./chat/components/ChatView";

import { LoadingState } from "./shared/components/LoadingState";
import { ErrorState } from "./shared/components/ErrorState";

import type { ConversationPreview } from "./conversations/services/conversations.service";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type ConversationId = Id<"conversations">;
type UserId = Id<"users">;

type ConversationFilter = "all" | "unread" | "groups";

type MessagesPageProps = {
  initialConversationId?: ConversationId;
  className?: string;
  onBack?: () => void;

  /**
   * Espace réservé en bas de l'écran pour ne pas passer sous la navigation
   * flottante de l'application.
   */
  bottomInset?: number;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const WIDE_BREAKPOINT = 768;
const LIST_PANEL_WIDTH = 380;
const DEFAULT_BOTTOM_INSET = 96;

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function readUnread(conversation: ConversationPreview): number {
  const value = (conversation as unknown as { unreadCount?: unknown })
    .unreadCount;

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function hasUnreadField(conversation: ConversationPreview): boolean {
  return (
    typeof (conversation as unknown as { unreadCount?: unknown })
      .unreadCount === "number"
  );
}

function readIsGroup(conversation: ConversationPreview): boolean {
  return (conversation as unknown as { isGroup?: unknown }).isGroup === true;
}

function hasGroupField(conversation: ConversationPreview): boolean {
  return (
    typeof (conversation as unknown as { isGroup?: unknown }).isGroup ===
    "boolean"
  );
}

/* ============================================================================
 * FILTER CHIP
 * ========================================================================== */

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={4}
      className={[
        "rounded-full border px-4 py-2 active:opacity-70",
        active
          ? "border-primary/50 bg-primary/20"
          : "border-white/10 bg-white/[0.04]",
      ].join(" ")}
    >
      <Text
        className={[
          "text-[13px] font-semibold",
          active ? "text-white" : "text-white/55",
        ].join(" ")}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ============================================================================
 * PAGE
 * ========================================================================== */

export default function MessagesPage({
  initialConversationId,
  className = "",
  onBack,
  bottomInset = DEFAULT_BOTTOM_INSET,
}: MessagesPageProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isWide = width >= WIDE_BREAKPOINT;

  /* ==========================================================================
   * ROOT DIMENSIONS
   * ======================================================================== */

  const rootStyle = useMemo(
    () => ({
      width,
      height,
      paddingTop: insets.top,
    }),
    [height, insets.top, width],
  );

  /* ==========================================================================
   * CURRENT USER
   * ======================================================================== */

  const currentUser = useCurrentUser();

  const currentUserId: UserId | null = currentUser?._id ?? null;

  /**
   * Une seule instance globale de présence est démarrée au niveau de la page.
   * Les écrans enfants peuvent ensuite uniquement observer la présence
   * nécessaire à leur contexte.
   */
  usePresence({ autoStart: true });

  /* ==========================================================================
   * CONVERSATIONS
   * ======================================================================== */

  const {
    previews,
    unreadCount,
    isLoading: conversationsLoading,
  } = useConversations(currentUserId);

  /* ==========================================================================
   * USERS — NEW CONVERSATION
   * ======================================================================== */

  const users = useQuery(
    api.users.listForMessaging,
    currentUserId ? {} : "skip",
  );

  /* ==========================================================================
   * MESSAGE FEATURE STATE
   * ======================================================================== */

  const feature = useMessagesFeature();

  const { activeConversationId, actions } = feature;

  /* ==========================================================================
   * UI STATE
   * ======================================================================== */

  const [mobilePanel, setMobilePanel] = useState<"conversations" | "chat">(
    initialConversationId ? "chat" : "conversations",
  );

  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  const [filter, setFilter] = useState<ConversationFilter>("all");

  /* ==========================================================================
   * DERIVED STATE
   * ======================================================================== */

  const selectedConversationId =
    activeConversationId ?? initialConversationId ?? null;

  const isLoadingCurrentUser = currentUser === undefined;

  const isLoadingUsers = currentUserId !== null && users === undefined;

  const isLoading = conversationsLoading || isLoadingCurrentUser;

  const showList = isWide || mobilePanel === "conversations";

  const showChat = isWide || mobilePanel === "chat";

  const canFilterUnread = useMemo(
    () => previews.some(hasUnreadField),
    [previews],
  );

  const canFilterGroups = useMemo(
    () => previews.some(hasGroupField),
    [previews],
  );

  const filteredPreviews = useMemo<ConversationPreview[]>(() => {
    switch (filter) {
      case "unread":
        return previews.filter((conversation) => readUnread(conversation) > 0);

      case "groups":
        return previews.filter(readIsGroup);

      case "all":
      default:
        return previews;
    }
  }, [filter, previews]);

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

  const rootClassName = useMemo(
    () =>
      ["flex flex-row min-h-0 overflow-hidden bg-[#050509]", className]
        .filter(Boolean)
        .join(" "),
    [className],
  );

  /* ==========================================================================
   * SELECT CONVERSATION
   * ======================================================================== */

  const handleSelectConversation = useCallback(
    (conversationId: ConversationId) => {
      actions.openConversation(conversationId);
      setMobilePanel("chat");
    },
    [actions],
  );

  const handleSearchSelect = useCallback(
    (conversation: ConversationPreview) => {
      handleSelectConversation(conversation.conversationId);
    },
    [handleSelectConversation],
  );

  /* ==========================================================================
   * INITIAL CONVERSATION
   * ======================================================================== */

  useEffect(() => {
    if (!initialConversationId) {
      return;
    }

    if (activeConversationId === initialConversationId) {
      setMobilePanel("chat");
      return;
    }

    actions.openConversation(initialConversationId);
    setMobilePanel("chat");
  }, [initialConversationId, activeConversationId, actions]);

  /* ==========================================================================
   * BACK NAVIGATION
   * ======================================================================== */

  const handleBackToConversations = useCallback(() => {
    setMobilePanel("conversations");
  }, []);

  /**
   * Android hardware back:
   *
   * 1. ferme la feuille "Nouvelle conversation" si elle est ouverte ;
   * 2. sur mobile, revient du chat vers la liste ;
   * 3. sinon laisse la navigation racine de l'application gérer le retour.
   */
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isNewConversationOpen) {
          setIsNewConversationOpen(false);
          return true;
        }

        if (!isWide && mobilePanel === "chat") {
          setMobilePanel("conversations");
          return true;
        }

        return false;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isNewConversationOpen, isWide, mobilePanel]);

  /* ==========================================================================
   * NEW CONVERSATION
   * ======================================================================== */

  const handleNewConversation = useCallback(() => {
    setIsNewConversationOpen(true);
  }, []);

  const handleCloseNewConversation = useCallback(() => {
    setIsNewConversationOpen(false);
  }, []);

  const handleConversationCreated = useCallback(
    (conversationId: ConversationId) => {
      setIsNewConversationOpen(false);
      handleSelectConversation(conversationId);
    },
    [handleSelectConversation],
  );

  /* ==========================================================================
   * LOADING
   * ======================================================================== */

  if (isLoading) {
    return (
      <View
        className={rootClassName}
        style={rootStyle}
        accessibilityLabel="Messagerie"
      >
        <View className="flex-1 items-center justify-center">
          <LoadingState />
        </View>
      </View>
    );
  }

  /* ==========================================================================
   * AUTHENTICATION SAFETY
   * ======================================================================== */

  if (!currentUserId) {
    return (
      <View
        className={rootClassName}
        style={rootStyle}
        accessibilityLabel="Messagerie"
      >
        <View className="flex-1 items-center justify-center p-6">
          <ErrorState />
        </View>
      </View>
    );
  }

  /* ==========================================================================
   * UI
   * ======================================================================== */

  return (
    <>
      <View
        className={rootClassName}
        style={rootStyle}
        accessibilityLabel="Messagerie"
      >
        {/* ==================================================================
            CONVERSATIONS LIST
            ================================================================== */}

        {showList ? (
          <View
            className="flex flex-col min-h-0 min-w-0 border-r border-white/10 bg-[#050509]"
            style={
              isWide
                ? { width: LIST_PANEL_WIDTH }
                : {
                    flex: 1,
                    width: "100%",
                  }
            }
            accessibilityLabel="Conversations"
          >
            {/* HEADER */}

            <View className="flex-row items-center justify-between px-4 pb-2 pt-4">
              <View className="min-w-0 flex-1 flex-row items-center gap-3">
                {onBack ? (
                  <Pressable
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel="Retour"
                    hitSlop={8}
                    className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] active:opacity-70"
                  >
                    <ArrowLeft size={20} color="rgba(255,255,255,0.8)" />
                  </Pressable>
                ) : null}

                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[26px] font-bold tracking-tight text-white"
                    numberOfLines={1}
                  >
                    Messages
                  </Text>

                  <Text className="mt-0.5 text-[13px] text-white/45">
                    {unreadCount > 0
                      ? `${unreadCount} message${
                          unreadCount > 1 ? "s" : ""
                        } non lu${unreadCount > 1 ? "s" : ""}`
                      : "Vos conversations"}
                  </Text>
                </View>
              </View>

              {unreadCount > 0 ? (
                <View className="h-7 min-w-[28px] items-center justify-center rounded-full bg-primary px-2">
                  <Text className="text-[12px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* SEARCH */}

            <View className="px-3 pb-2 pt-1">
              <ConversationSearch
                conversations={previews}
                onSelect={handleSearchSelect}
              />
            </View>

            {/* FILTERS */}

            {canFilterUnread || canFilterGroups ? (
              <View className="flex-row gap-2 px-4 pb-2 pt-1">
                <FilterChip
                  label="Toutes"
                  active={filter === "all"}
                  onPress={() => setFilter("all")}
                />

                {canFilterUnread ? (
                  <FilterChip
                    label="Non lues"
                    active={filter === "unread"}
                    onPress={() => setFilter("unread")}
                  />
                ) : null}

                {canFilterGroups ? (
                  <FilterChip
                    label="Groupes"
                    active={filter === "groups"}
                    onPress={() => setFilter("groups")}
                  />
                ) : null}
              </View>
            ) : null}

            {/* LIST */}

            <View
              className="min-h-0 flex-1 px-2 py-2"
              style={{
                paddingBottom: bottomInset + 72,
              }}
            >
              {previews.length === 0 ? (
                <View className="flex-1 items-center justify-center px-4">
                  <EmptyConversations
                    onNewConversation={handleNewConversation}
                  />
                </View>
              ) : filteredPreviews.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                  <Text className="text-center text-[15px] font-semibold text-white/70">
                    Aucune conversation
                  </Text>

                  <Text className="mt-1 text-center text-[13px] text-white/40">
                    Aucun résultat pour ce filtre.
                  </Text>

                  <Pressable
                    onPress={() => setFilter("all")}
                    accessibilityRole="button"
                    accessibilityLabel="Voir toutes les conversations"
                    className="mt-4 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 active:opacity-70"
                  >
                    <Text className="text-[13px] font-semibold text-white/80">
                      Voir toutes les conversations
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <ConversationList
                  conversations={filteredPreviews}
                  currentConversationId={selectedConversationId}
                  onSelect={handleSelectConversation}
                />
              )}
            </View>

            {/* NEW CONVERSATION FAB */}

            <Pressable
              onPress={handleNewConversation}
              accessibilityRole="button"
              accessibilityLabel="Nouvelle conversation"
              hitSlop={6}
              className="absolute right-5 h-14 w-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
              style={{
                bottom: bottomInset,
                elevation: 8,
                shadowColor: "#7C3AED",
                shadowOpacity: 0.45,
                shadowRadius: 14,
                shadowOffset: {
                  width: 0,
                  height: 6,
                },
              }}
            >
              <Plus size={26} color="#ffffff" />
            </Pressable>
          </View>
        ) : null}

        {/* ==================================================================
            CHAT
            ================================================================== */}

        {showChat ? (
          <View
            className="min-h-0 min-w-0 flex-1 bg-black"
            style={{
              flex: 1,
              minWidth: 0,
            }}
            accessibilityLabel={
              activeConversation
                ? `Conversation avec ${activeConversation.title}`
                : "Conversation"
            }
          >
            {selectedConversationId ? (
              <ChatView
                conversationId={selectedConversationId}
                currentUserId={currentUserId}
                onBack={isWide ? undefined : handleBackToConversations}
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-black p-6">
                <View className="mb-6 h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04]">
                  <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <MessageCircle size={32} color="#8b5cf6" />
                  </View>
                </View>

                <Text className="text-center text-3xl font-semibold tracking-tight text-white">
                  Vos messages
                </Text>

                <Text className="mt-3 max-w-md text-center text-sm leading-6 text-white/40">
                  Sélectionnez une conversation pour commencer à échanger.
                </Text>

                <Pressable
                  onPress={handleNewConversation}
                  accessibilityRole="button"
                  accessibilityLabel="Nouvelle conversation"
                  className="mt-7 flex-row items-center gap-2 rounded-xl bg-primary px-5 py-3 active:opacity-80"
                >
                  <Plus size={16} color="#ffffff" />

                  <Text className="text-sm font-semibold text-white">
                    Nouvelle conversation
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* =====================================================================
          NEW CONVERSATION MODAL
          ===================================================================== */}

      {isNewConversationOpen ? (
        <Modal
          visible
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={handleCloseNewConversation}
        >
          <View
            className="justify-end bg-black/60"
            style={{
              width,
              height,
            }}
          >
            {/* BACKDROP */}

            <Pressable
              onPress={handleCloseNewConversation}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              className="flex-1"
            />

            {/* SHEET */}

            <View
              className="rounded-t-3xl border-t border-white/10 bg-[#0B0B12]"
              style={{
                maxHeight: height * 0.85,
                paddingBottom: Math.max(insets.bottom, 12),
              }}
              accessibilityViewIsModal
              accessibilityLabel="Nouvelle conversation"
            >
              {/* HANDLE */}

              <View className="items-center pt-2">
                <View className="h-1 w-10 rounded-full bg-white/20" />
              </View>

              {/* HEADER */}

              <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
                <View className="min-w-0 flex-1 pr-4">
                  <Text className="text-lg font-semibold text-white">
                    Nouvelle conversation
                  </Text>

                  <Text className="mt-0.5 text-sm text-white/40">
                    Choisissez une personne avec qui discuter.
                  </Text>
                </View>

                <Pressable
                  onPress={handleCloseNewConversation}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                  hitSlop={8}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] active:opacity-70"
                >
                  <X size={20} color="rgba(255,255,255,0.7)" />
                </Pressable>
              </View>

              {/* CONTENT */}

              <ScrollView
                className="px-5 pt-4"
                contentContainerStyle={{
                  paddingBottom: 32,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {isLoadingUsers ? (
                  <View className="min-h-40 items-center justify-center">
                    <LoadingState />
                  </View>
                ) : (
                  <NewConversation
                    users={users ?? []}
                    onCreated={handleConversationCreated}
                  />
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}
