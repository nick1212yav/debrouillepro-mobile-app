import { useMemo } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { ArrowLeft, Info, Phone, Video } from "lucide-react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { usePresence } from "../../presence/hooks/usePresence";
import { useTyping } from "../../typing/hooks/useTyping";

import { useChat } from "../hooks/useChat";

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

const CHAT_BACKGROUND = "#07070C";
const HEADER_BACKGROUND = "#0D0D15";
const BORDER_COLOR = "rgba(255,255,255,0.08)";
const TOP_BAR_HEIGHT = 64;

const AVATAR_COLORS = [
  "#6D28D9",
  "#0E7490",
  "#B45309",
  "#BE185D",
  "#047857",
  "#1D4ED8",
  "#9333EA",
  "#C2410C",
];

function isHttpUrl(value?: string | null): value is string {
  return typeof value === "string" && /^https?:\/\/.+/i.test(value);
}

function pickAvatarColor(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function TopBarAvatar({
  title,
  avatar,
  size = 42,
}: {
  title: string;
  avatar?: string | null;
  size?: number;
}) {
  const radius = size / 2;

  if (isHttpUrl(avatar)) {
    return (
      <Image
        source={{ uri: avatar }}
        accessibilityLabel={title}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: "#1F1F2B",
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pickAvatarColor(title),
      }}
    >
      <Text style={styles.avatarInitial}>
        {title.trim().charAt(0).toUpperCase() || "?"}
      </Text>
    </View>
  );
}

function ChatTopBar({
  title,
  avatar,
  isGroup,
  memberCount,
  presenceLabel,
  onBack,
  onInfo,
  onCall,
  onVideoCall,
}: {
  title?: string | null;
  avatar?: string | null;
  isGroup: boolean;
  memberCount: number;
  presenceLabel?: string | null;
  onBack?: () => void;
  onInfo?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
}) {
  const displayTitle = title?.trim() || "Conversation";

  const subtitle = isGroup
    ? `${memberCount} participant${memberCount > 1 ? "s" : ""}`
    : (presenceLabel ?? null);

  return (
    <View style={styles.topBar}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>
      ) : (
        <View style={styles.topBarSpacer} />
      )}

      <TopBarAvatar title={displayTitle} avatar={avatar} />

      <View style={styles.topBarText}>
        <Text style={styles.topBarTitle} numberOfLines={1} ellipsizeMode="tail">
          {displayTitle}
        </Text>

        {subtitle ? (
          <Text
            style={styles.topBarSubtitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.topBarActions}>
        {onVideoCall ? (
          <Pressable
            onPress={onVideoCall}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Appel vidéo"
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Video size={21} color="rgba(255,255,255,0.85)" />
          </Pressable>
        ) : null}

        {onCall ? (
          <Pressable
            onPress={onCall}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Appel vocal"
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Phone size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        ) : null}

        {onInfo ? (
          <Pressable
            onPress={onInfo}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Informations"
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <Info size={21} color="rgba(255,255,255,0.85)" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ChatView({
  conversationId,
  currentUserId,
  onBack,
  onInfo,
  onCall,
  onVideoCall,
}: ChatViewProps) {
  const { height } = useWindowDimensions();

  const chat = useChat(conversationId, currentUserId);

  const typing = useTyping(conversationId);

  const otherParticipant = useMemo(() => {
    const participants = chat.conversation?.participants;

    if (!participants || participants.length === 0) {
      return null;
    }

    return (
      participants.find(
        (participant) => String(participant._id) !== String(currentUserId),
      ) ?? null
    );
  }, [chat.conversation?.participants, currentUserId]);

  const otherUserId = otherParticipant?._id;

  const presence = usePresence({
    userId: otherUserId,
    autoStart: false,
  });

  const presenceLabel = typing.isSomeoneTyping
    ? typing.typingText
    : presence.presence?.status === "online"
      ? "en ligne"
      : null;

  if (chat.isLoading) {
    return (
      <View
        style={styles.root}
        accessibilityLabel="Chargement de la conversation"
        accessibilityState={{ busy: true }}
      >
        <View style={styles.topBar}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={styles.iconButton}
            >
              <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
            </Pressable>
          ) : (
            <View style={styles.topBarSpacer} />
          )}

          <View style={styles.skeletonAvatar} />

          <View style={styles.topBarText}>
            <View style={styles.skeletonLineLong} />
            <View style={styles.skeletonLineShort} />
          </View>
        </View>

        <View style={styles.skeletonBody}>
          <View style={[styles.skeletonBubble, styles.skeletonIncoming]} />

          <View style={[styles.skeletonBubble, styles.skeletonOutgoing]} />

          <View
            style={[
              styles.skeletonBubble,
              styles.skeletonIncoming,
              { width: "62%" },
            ]}
          />

          <View
            style={[
              styles.skeletonBubble,
              styles.skeletonOutgoing,
              { width: "38%" },
            ]}
          />

          <Text style={styles.loadingText}>Chargement de la conversation…</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      accessibilityLabel={chat.title?.trim() || "Conversation"}
    >
      <ChatTopBar
        title={chat.title}
        avatar={chat.avatar}
        isGroup={chat.conversation?.isGroup ?? false}
        memberCount={chat.conversation?.participants?.length ?? 0}
        presenceLabel={presenceLabel}
        onBack={onBack}
        onInfo={onInfo}
        onCall={onCall}
        onVideoCall={onVideoCall}
      />

      <View style={styles.messagesWrap}>
        <MessagesArea
          messages={chat.messages}
          currentUserId={currentUserId}
          isLoadingMore={chat.isLoadingMore}
          isDone={chat.isDone}
          onLoadMore={chat.loadMoreMessages}
        />
      </View>

      {typing.isSomeoneTyping ? (
        <View style={styles.typingFooter}>
          <Text style={styles.typingText}>{typing.typingText}</Text>
        </View>
      ) : null}

      <View style={[styles.composerWrap, { maxHeight: height * 0.5 }]}>
        <MessageComposer conversationId={conversationId} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    backgroundColor: CHAT_BACKGROUND,
  },

  topBar: {
    height: TOP_BAR_HEIGHT,
    flexShrink: 0,
    flexGrow: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 6,
    backgroundColor: HEADER_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    zIndex: 20,
  },

  topBarSpacer: {
    width: 8,
  },

  topBarText: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  topBarTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },

  topBarSubtitle: {
    marginTop: 1,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12.5,
    lineHeight: 16,
  },

  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  messagesWrap: {
    flex: 1,
    minHeight: 0,
    backgroundColor: CHAT_BACKGROUND,
  },

  typingFooter: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: HEADER_BACKGROUND,
  },

  typingText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.55)",
  },

  composerWrap: {
    flexShrink: 0,
    zIndex: 20,
    backgroundColor: HEADER_BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },

  skeletonAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  skeletonLineLong: {
    width: 130,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  skeletonLineShort: {
    width: 80,
    height: 10,
    marginTop: 7,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonBody: {
    flex: 1,
    minHeight: 0,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },

  skeletonBubble: {
    height: 46,
    borderRadius: 18,
  },

  skeletonIncoming: {
    alignSelf: "flex-start",
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  skeletonOutgoing: {
    alignSelf: "flex-end",
    width: "58%",
    backgroundColor: "rgba(139,92,246,0.18)",
  },

  loadingText: {
    marginTop: 8,
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ChatView;
