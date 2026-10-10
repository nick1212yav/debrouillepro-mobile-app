// src/features/messages/MessagesPage.tsx

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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

import { useCall } from "./calls/hooks/useCall";
import { IncomingCall } from "./calls/components/IncomingCall";
import { OutgoingCall } from "./calls/components/OutgoingCall";
import { ActiveCall } from "./calls/components/ActiveCall";
import type { Call } from "./calls/types/call.types";

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
  bottomInset?: number;
};

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const WIDE_BREAKPOINT = 768;
const LIST_PANEL_WIDTH = 380;

/** Espace minimum réservé en bas de la liste. */
const DEFAULT_BOTTOM_INSET = 24;

const FAB_SIZE = 58;
const FAB_RIGHT = 18;
/** Marge minimum entre le FAB et l'inset bas. */
const FAB_BOTTOM_GAP = 16;

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function unreadCountOf(conversation: ConversationPreview): number {
  const value = (
    conversation as unknown as {
      unreadCount?: unknown;
    }
  ).unreadCount;

  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

function isGroupConversation(conversation: ConversationPreview): boolean {
  return (
    (
      conversation as unknown as {
        isGroup?: unknown;
      }
    ).isGroup === true
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
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.filterChipPressed,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          active ? styles.filterChipTextActive : styles.filterChipTextInactive,
        ]}
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

  /* --------------------------------------------------------------------------
   * CURRENT USER
   * ------------------------------------------------------------------------ */

  const currentUser = useCurrentUser();
  const currentUserId: UserId | null = currentUser?._id ?? null;

  usePresence({ autoStart: true });

  /* --------------------------------------------------------------------------
   * CONVERSATIONS
   * ------------------------------------------------------------------------ */

  const {
    previews,
    unreadCount,
    isLoading: conversationsLoading,
  } = useConversations(currentUserId);

  /* --------------------------------------------------------------------------
   * USERS
   * ------------------------------------------------------------------------ */

  const users = useQuery(
    api.users.listForMessaging,
    currentUserId ? {} : "skip",
  );

  /* --------------------------------------------------------------------------
   * FEATURE STATE
   * ------------------------------------------------------------------------ */

  const { activeConversationId, actions } = useMessagesFeature();

  /* --------------------------------------------------------------------------
   * UI STATE
   * ------------------------------------------------------------------------ */

  const [mobilePanel, setMobilePanel] = useState<"conversations" | "chat">(
    initialConversationId ? "chat" : "conversations",
  );

  const [filter, setFilter] = useState<ConversationFilter>("all");

  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);

  const [hasStartedCall, setHasStartedCall] = useState(false);

  /* --------------------------------------------------------------------------
   * DERIVED STATE
   * ------------------------------------------------------------------------ */

  const selectedConversationId =
    activeConversationId ?? initialConversationId ?? null;

  const isLoading = currentUser === undefined || conversationsLoading;

  const showList = isWide || mobilePanel === "conversations";

  const showChat = isWide || mobilePanel === "chat";

  const filteredConversations = useMemo(() => {
    if (filter === "unread") {
      return previews.filter((conversation) => unreadCountOf(conversation) > 0);
    }

    if (filter === "groups") {
      return previews.filter(isGroupConversation);
    }

    return previews;
  }, [filter, previews]);

  const activeConversation = useMemo(
    () =>
      selectedConversationId
        ? (previews.find(
            (conversation) =>
              conversation.conversationId === selectedConversationId,
          ) ?? null)
        : null,
    [previews, selectedConversationId],
  );

  /* ==========================================================================
   * CALLS
   * ======================================================================== */

  const call = useCall({
    conversationId: selectedConversationId ?? undefined,
  });

  const activeCall = call.activeCall ?? null;

  const callStatus = useMemo<"incoming" | "outgoing" | "active" | null>(() => {
    if (!activeCall) {
      return null;
    }

    const status = String(activeCall.status ?? "").toLowerCase();

    if (
      status === "active" ||
      status === "answered" ||
      status === "connected"
    ) {
      return "active";
    }

    return hasStartedCall ? "outgoing" : "incoming";
  }, [activeCall, hasStartedCall]);

  const handleAudioCall = useCallback(() => {
    if (!selectedConversationId) {
      return;
    }

    setHasStartedCall(true);

    void call.startCall("audio").catch(() => {
      setHasStartedCall(false);
    });
  }, [call, selectedConversationId]);

  const handleVideoCall = useCallback(() => {
    if (!selectedConversationId) {
      return;
    }

    setHasStartedCall(true);

    void call.startCall("video").catch(() => {
      setHasStartedCall(false);
    });
  }, [call, selectedConversationId]);

  const handleAnswerCall = useCallback(() => {
    if (!activeCall) {
      return;
    }

    void call
      .answerCall(activeCall._id)
      .then(() => {
        setHasStartedCall(false);
      })
      .catch(() => undefined);
  }, [activeCall, call]);

  const handleRejectCall = useCallback(() => {
    if (!activeCall) {
      return;
    }

    void call.rejectCall(activeCall._id).finally(() => {
      setHasStartedCall(false);
    });
  }, [activeCall, call]);

  const handleEndCall = useCallback(() => {
    if (!activeCall) {
      setHasStartedCall(false);
      return;
    }

    void call.endCall(activeCall._id).finally(() => {
      setHasStartedCall(false);
    });
  }, [activeCall, call]);

  /* ==========================================================================
   * CONVERSATIONS
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

  useEffect(() => {
    if (!initialConversationId) {
      return;
    }

    actions.openConversation(initialConversationId);
    setMobilePanel("chat");
  }, [actions, initialConversationId]);

  /* ==========================================================================
   * BACK
   * ======================================================================== */

  const handleBackToConversations = useCallback(() => {
    setMobilePanel("conversations");
  }, []);

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

    return () => subscription.remove();
  }, [isNewConversationOpen, isWide, mobilePanel]);

  /* ==========================================================================
   * NEW CONVERSATION
   * ======================================================================== */

  const handleNewConversation = useCallback(() => {
    setIsNewConversationOpen(true);
  }, []);

  const handleConversationCreated = useCallback(
    (conversationId: ConversationId) => {
      setIsNewConversationOpen(false);
      handleSelectConversation(conversationId);
    },
    [handleSelectConversation],
  );

  /* ==========================================================================
   * FAB BOTTOM OFFSET (safe area aware)
   * ======================================================================== */

  const fabBottom = Math.max(insets.bottom, FAB_BOTTOM_GAP) + FAB_BOTTOM_GAP;

  /* ==========================================================================
   * LOADING
   * ======================================================================== */

  if (isLoading) {
    return (
      <View
        style={[
          styles.page,
          {
            width,
            height,
            paddingTop: insets.top,
          },
        ]}
        accessibilityLabel="Messagerie"
      >
        <View style={styles.centerContent}>
          <LoadingState />
        </View>
      </View>
    );
  }

  /* ==========================================================================
   * AUTH ERROR
   * ======================================================================== */

  if (!currentUserId) {
    return (
      <View
        style={[
          styles.page,
          {
            width,
            height,
            paddingTop: insets.top,
          },
        ]}
        accessibilityLabel="Messagerie"
      >
        <View style={styles.centerContentWithPadding}>
          <ErrorState />
        </View>
      </View>
    );
  }

  /* ==========================================================================
   * PAGE
   * ======================================================================== */

  return (
    <>
      <View
        style={[
          styles.page,
          {
            width,
            height,
            paddingTop: insets.top,
          },
        ]}
        accessibilityLabel="Messagerie"
      >
        {/* ==================================================================
            CONVERSATIONS
            ================================================================== */}

        {showList ? (
          <View
            style={[
              styles.listPanel,
              isWide ? styles.listPanelWide : styles.listPanelMobile,
            ]}
          >
            {/* HEADER */}

            <View style={styles.listHeader}>
              <View style={styles.listHeaderText}>
                <Text style={styles.pageTitle} numberOfLines={1}>
                  Messages
                </Text>

                <Text style={styles.pageSubtitle} numberOfLines={1}>
                  {unreadCount > 0
                    ? `${unreadCount} message${
                        unreadCount > 1 ? "s" : ""
                      } non lu${unreadCount > 1 ? "s" : ""}`
                    : "Vos conversations"}
                </Text>
              </View>

              {onBack ? (
                <Pressable
                  onPress={onBack}
                  accessibilityRole="button"
                  accessibilityLabel="Retour"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <ArrowLeft size={22} color="rgba(255,255,255,0.86)" />
                </Pressable>
              ) : null}
            </View>

            {/* SEARCH */}

            <View style={styles.searchContainer}>
              <ConversationSearch
                conversations={previews}
                onSelect={handleSearchSelect}
              />
            </View>

            {/* FILTERS */}

            <View style={styles.filtersContainer}>
              <FilterChip
                label="Toutes"
                active={filter === "all"}
                onPress={() => setFilter("all")}
              />

              <FilterChip
                label="Non lues"
                active={filter === "unread"}
                onPress={() => setFilter("unread")}
              />

              <FilterChip
                label="Groupes"
                active={filter === "groups"}
                onPress={() => setFilter("groups")}
              />
            </View>

            {/* LISTE */}

            <View style={styles.conversationArea}>
              {filteredConversations.length > 0 ? (
                <ScrollView
                  style={styles.conversationScroll}
                  contentContainerStyle={[
                    styles.conversationContent,
                    {
                      paddingBottom:
                        Math.max(bottomInset, DEFAULT_BOTTOM_INSET) +
                        FAB_SIZE +
                        fabBottom +
                        8,
                    },
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentInsetAdjustmentBehavior="never"
                >
                  <ConversationList
                    conversations={filteredConversations}
                    currentConversationId={selectedConversationId}
                    onSelect={handleSelectConversation}
                  />
                </ScrollView>
              ) : previews.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <EmptyConversations
                    onNewConversation={handleNewConversation}
                  />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <MessageCircle size={42} color="rgba(255,255,255,0.25)" />

                  <Text style={styles.emptyTitle}>Aucune conversation</Text>

                  <Text style={styles.emptyDescription}>
                    Aucune conversation ne correspond à ce filtre.
                  </Text>

                  <Pressable
                    onPress={() => setFilter("all")}
                    accessibilityRole="button"
                    accessibilityLabel="Afficher toutes les conversations"
                    style={({ pressed }) => [
                      styles.startConversationButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.startConversationText}>
                      Voir toutes
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* FAB — position bottom calculée avec la safe area */}

            <Pressable
              onPress={handleNewConversation}
              accessibilityRole="button"
              accessibilityLabel="Nouvelle conversation"
              hitSlop={10}
              style={({ pressed }) => [
                styles.floatingButton,
                { bottom: fabBottom },
                pressed && styles.floatingButtonPressed,
              ]}
            >
              <Plus size={28} strokeWidth={2.6} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}

        {/* ==================================================================
            CHAT
            ================================================================== */}

        {showChat ? (
          <View
            style={styles.chatPanel}
            accessibilityLabel={
              activeConversation
                ? `Conversation avec ${
                    activeConversation.title ?? "Conversation"
                  }`
                : "Conversation"
            }
          >
            {selectedConversationId ? (
              <ChatView
                conversationId={selectedConversationId}
                currentUserId={currentUserId}
                onBack={isWide ? undefined : handleBackToConversations}
                onCall={handleAudioCall}
                onVideoCall={handleVideoCall}
                isCallActive={callStatus === "active"}
                isVideoCallActive={
                  callStatus === "active" &&
                  String(activeCall?.type ?? "").toLowerCase() === "video"
                }
                hasIncomingCall={callStatus === "incoming"}
              />
            ) : (
              <View style={styles.chatEmpty}>
                <View style={styles.chatEmptyIcon}>
                  <MessageCircle size={42} color="rgba(255,255,255,0.35)" />
                </View>

                <Text style={styles.chatEmptyTitle}>Vos messages</Text>

                <Text style={styles.chatEmptyDescription}>
                  Sélectionnez une conversation pour commencer à échanger.
                </Text>

                {!isWide ? (
                  <Pressable
                    onPress={handleBackToConversations}
                    accessibilityRole="button"
                    accessibilityLabel="Voir les conversations"
                    style={({ pressed }) => [
                      styles.startConversationButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ArrowLeft size={18} color="#FFFFFF" />

                    <Text style={styles.startConversationText}>
                      Voir les conversations
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* ====================================================================
          NEW CONVERSATION MODAL
          ================================================================== */}

      <Modal
        visible={isNewConversationOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsNewConversationOpen(false)}
      >
        <View
          style={[
            styles.modalRoot,
            {
              paddingTop: insets.top,
            },
          ]}
        >
          <Pressable
            onPress={() => setIsNewConversationOpen(false)}
            style={styles.modalBackdrop}
          />

          <View
            style={[
              styles.newConversationSheet,
              {
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <View style={styles.modalHandleContainer}>
              <View style={styles.modalHandle} />
            </View>

            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Nouvelle conversation</Text>

                <Text style={styles.modalSubtitle}>
                  Choisissez une personne avec qui discuter.
                </Text>
              </View>

              <Pressable
                onPress={() => setIsNewConversationOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && styles.pressed,
                ]}
              >
                <X size={19} color="rgba(255,255,255,0.72)" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.newConversationScroll}
              contentContainerStyle={{
                paddingBottom: 32,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <NewConversation
                users={users ?? []}
                onCreated={handleConversationCreated}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ====================================================================
          CALL OVERLAY
          ================================================================== */}

      {activeCall && callStatus ? (
        <Modal
          visible
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => undefined}
        >
          <View style={styles.callOverlay}>
            {callStatus === "active" ? (
              <ActiveCall
                callId={activeCall._id}
                onEnded={() => setHasStartedCall(false)}
              />
            ) : callStatus === "outgoing" ? (
              <OutgoingCall
                call={activeCall as unknown as Call}
                recipientName={activeConversation?.title ?? "Conversation"}
                recipientAvatar={activeConversation?.avatar ?? undefined}
                onCancel={handleEndCall}
              />
            ) : (
              <IncomingCall
                call={activeCall as unknown as Call}
                callerName={activeConversation?.title ?? "Conversation"}
                callerAvatar={activeConversation?.avatar ?? undefined}
                onAccept={handleAnswerCall}
                onReject={handleRejectCall}
              />
            )}
          </View>
        </Modal>
      ) : null}
    </>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  /* --------------------------------------------------------------------------
   * PAGE
   * ------------------------------------------------------------------------ */

  page: {
    flex: 1,
    flexDirection: "row",

    minWidth: 0,
    minHeight: 0,

    overflow: "hidden",

    backgroundColor: "#050509",
  },

  centerContent: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  centerContentWithPadding: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    padding: 24,
  },

  /* --------------------------------------------------------------------------
   * LIST PANEL
   * ------------------------------------------------------------------------ */

  listPanel: {
    position: "relative",

    minWidth: 0,
    minHeight: 0,

    overflow: "hidden",

    backgroundColor: "#050509",

    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.10)",
  },

  listPanelWide: {
    width: LIST_PANEL_WIDTH,

    flexGrow: 0,
    flexShrink: 0,
  },

  listPanelMobile: {
    width: "100%",

    flex: 1,

    borderRightWidth: 0,
  },

  /* --------------------------------------------------------------------------
   * LIST HEADER
   * ------------------------------------------------------------------------ */

  listHeader: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },

  listHeaderText: {
    flex: 1,

    minWidth: 0,
  },

  pageTitle: {
    fontSize: 30,
    lineHeight: 36,

    fontWeight: "800",
    letterSpacing: -0.6,

    color: "#FFFFFF",
  },

  pageSubtitle: {
    marginTop: 3,

    fontSize: 14,
    lineHeight: 20,

    color: "rgba(255,255,255,0.45)",
  },

  backButton: {
    width: 42,
    height: 42,

    flexGrow: 0,
    flexShrink: 0,

    marginLeft: 10,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 21,

    backgroundColor: "rgba(255,255,255,0.04)",
  },

  /* --------------------------------------------------------------------------
   * SEARCH
   * ------------------------------------------------------------------------ */

  searchContainer: {
    width: "100%",

    paddingHorizontal: 12,
  },

  /* --------------------------------------------------------------------------
   * FILTERS
   * ------------------------------------------------------------------------ */

  filtersContainer: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,

    gap: 8,
  },

  filterChip: {
    minHeight: 40,

    flexGrow: 0,
    flexShrink: 0,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 15,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,

    backgroundColor: "rgba(255,255,255,0.04)",
  },

  filterChipActive: {
    borderColor: "rgba(139,92,246,0.50)",

    backgroundColor: "rgba(139,92,246,0.20)",
  },

  filterChipPressed: {
    opacity: 0.72,
  },

  filterChipText: {
    fontSize: 13,
    lineHeight: 18,

    fontWeight: "600",
  },

  filterChipTextActive: {
    color: "#FFFFFF",
  },

  filterChipTextInactive: {
    color: "rgba(255,255,255,0.55)",
  },

  /* --------------------------------------------------------------------------
   * CONVERSATION AREA
   * ------------------------------------------------------------------------ */

  conversationArea: {
    flex: 1,

    minHeight: 0,
    minWidth: 0,

    position: "relative",

    overflow: "hidden",
  },

  conversationScroll: {
    flex: 1,

    minHeight: 0,
    minWidth: 0,
  },

  conversationContent: {
    width: "100%",

    paddingHorizontal: 8,
    paddingTop: 4,

    alignSelf: "stretch",
  },

  emptyContainer: {
    flex: 1,

    minHeight: 260,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 24,
  },

  emptyTitle: {
    marginTop: 16,

    fontSize: 20,
    lineHeight: 26,

    fontWeight: "700",
    textAlign: "center",

    color: "#FFFFFF",
  },

  emptyDescription: {
    maxWidth: 320,

    marginTop: 8,

    fontSize: 14,
    lineHeight: 21,

    textAlign: "center",

    color: "rgba(255,255,255,0.40)",
  },

  /* --------------------------------------------------------------------------
   * FAB
   * ------------------------------------------------------------------------ */

  floatingButton: {
    position: "absolute",

    right: FAB_RIGHT,

    width: FAB_SIZE,
    height: FAB_SIZE,

    flexGrow: 0,
    flexShrink: 0,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: FAB_SIZE / 2,

    backgroundColor: "#2563EB",

    elevation: 10,

    shadowColor: "#2563EB",
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    zIndex: 50,
  },

  floatingButtonPressed: {
    opacity: 0.82,

    transform: [{ scale: 0.94 }],
  },

  /* --------------------------------------------------------------------------
   * CHAT PANEL
   * ------------------------------------------------------------------------ */

  chatPanel: {
    flex: 1,

    minWidth: 0,
    minHeight: 0,

    overflow: "hidden",

    backgroundColor: "#000000",
  },

  chatEmpty: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 24,

    backgroundColor: "#000000",
  },

  chatEmptyIcon: {
    width: 96,
    height: 96,

    marginBottom: 24,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 28,

    backgroundColor: "rgba(255,255,255,0.04)",
  },

  chatEmptyTitle: {
    fontSize: 30,
    lineHeight: 36,

    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",

    color: "#FFFFFF",
  },

  chatEmptyDescription: {
    maxWidth: 380,

    marginTop: 12,

    fontSize: 14,
    lineHeight: 24,

    textAlign: "center",

    color: "rgba(255,255,255,0.40)",
  },

  startConversationButton: {
    flexDirection: "row",
    alignItems: "center",

    gap: 8,

    marginTop: 28,

    paddingHorizontal: 20,
    paddingVertical: 13,

    borderRadius: 12,

    backgroundColor: "#2563EB",
  },

  startConversationText: {
    fontSize: 14,
    lineHeight: 19,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  /* --------------------------------------------------------------------------
   * MODAL
   * ------------------------------------------------------------------------ */

  modalRoot: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: "rgba(0,0,0,0.65)",
  },

  modalBackdrop: {
    position: "absolute",

    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },

  newConversationSheet: {
    maxHeight: "85%",

    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    overflow: "hidden",

    backgroundColor: "#0B0B12",
  },

  modalHandleContainer: {
    alignItems: "center",

    paddingTop: 8,
  },

  modalHandle: {
    width: 40,
    height: 4,

    borderRadius: 999,

    backgroundColor: "rgba(255,255,255,0.20)",
  },

  modalHeader: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 20,
    paddingVertical: 16,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  modalHeaderText: {
    flex: 1,

    minWidth: 0,

    paddingRight: 16,
  },

  modalTitle: {
    fontSize: 18,
    lineHeight: 24,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  modalSubtitle: {
    marginTop: 4,

    fontSize: 14,
    lineHeight: 20,

    color: "rgba(255,255,255,0.40)",
  },

  modalCloseButton: {
    width: 36,
    height: 36,

    flexGrow: 0,
    flexShrink: 0,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 18,

    backgroundColor: "rgba(255,255,255,0.06)",
  },

  newConversationScroll: {
    flexGrow: 0,
  },

  /* --------------------------------------------------------------------------
   * CALL OVERLAY
   * ------------------------------------------------------------------------ */

  callOverlay: {
    flex: 1,

    justifyContent: "center",

    paddingHorizontal: 16,

    backgroundColor: "rgba(0,0,0,0.90)",
  },

  /* --------------------------------------------------------------------------
   * COMMON
   * ------------------------------------------------------------------------ */

  pressed: {
    opacity: 0.72,
  },
});
