import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Send, User } from "lucide-react-native";
import { Animated } from "react-native";

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: number;
  isMine: boolean;
  likes: number;
}

interface Props {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onLike: (messageId: string) => void;
  isLive?: boolean;
  maxHeight?: number;
}

const DEFAULT_MAX_HEIGHT = 300;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatMessageRow({
  message,
  onLike,
}: {
  message: ChatMessage;
  onLike: (messageId: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const handleLike = useCallback(() => {
    onLike(message.id);
  }, [message.id, onLike]);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        message.isMine ? styles.messageRowMine : styles.messageRowOther,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.avatar}>
        {message.userAvatar ? (
          <Image
            source={{ uri: message.userAvatar }}
            style={styles.avatarImage}
            accessibilityLabel={`Photo de ${message.userName}`}
          />
        ) : (
          <User />
        )}
      </View>

      <View style={styles.messageContent}>
        <View style={styles.messageMeta}>
          <Text style={styles.userName} numberOfLines={1}>
            {message.userName}
          </Text>

          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
        </View>

        <Text style={styles.messageText}>{message.message}</Text>
      </View>

      <Pressable
        onPress={handleLike}
        accessibilityRole="button"
        accessibilityLabel={
          message.likes > 0
            ? `Aimer le message de ${message.userName}, ${message.likes} j'aime`
            : `Aimer le message de ${message.userName}`
        }
        hitSlop={8}
        style={({ pressed }) => [styles.likeButton, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.heartIcon,
            message.likes > 0 && styles.heartIconActive,
          ]}
        >
          <Heart />
        </View>

        {message.likes > 0 ? (
          <Text style={styles.likeCount}>{message.likes}</Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function CommunityLiveChat({
  messages,
  onSend,
  onLike,
  isLive = true,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: Props) {
  const [newMessage, setNewMessage] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const safeMaxHeight =
    Number.isFinite(maxHeight) && maxHeight > 0
      ? maxHeight
      : DEFAULT_MAX_HEIGHT;

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const value = newMessage.trim();

    if (!value) {
      return;
    }

    onSend(value);
    setNewMessage("");
  }, [newMessage, onSend]);

  const renderMessage = useCallback(
    ({ item }: ListRenderItemInfo<ChatMessage>) => (
      <ChatMessageRow message={item} onLike={onLike} />
    ),
    [onLike],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat en direct</Text>

        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.messagesContainer, { maxHeight: safeMaxHeight }]}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aucun message. Soyez le premier à parler !
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            removeClippedSubviews
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={8}
          />
        )}
      </View>

      <View style={styles.composer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Écrire un message..."
          placeholderTextColor="rgba(255,255,255,0.30)"
          multiline
          maxLength={1000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
          style={styles.input}
          accessibilityLabel="Message"
          accessibilityHint="Écrivez votre message puis envoyez-le"
        />

        <Pressable
          onPress={handleSend}
          disabled={!newMessage.trim()}
          accessibilityRole="button"
          accessibilityLabel="Envoyer le message"
          style={({ pressed }) => [
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
            pressed && newMessage.trim() && styles.pressed,
          ]}
        >
          <Send />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 24,
  },

  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.62)",
    letterSpacing: 0.1,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FB7185",
  },

  liveText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FB7185",
    letterSpacing: 0.7,
  },

  messagesContainer: {
    width: "100%",
    minHeight: 48,
  },

  listContent: {
    gap: 6,
    paddingVertical: 2,
  },

  emptyState: {
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.30)",
    textAlign: "center",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },

  messageRowMine: {
    backgroundColor: "rgba(139,92,246,0.10)",
    borderColor: "rgba(139,92,246,0.20)",
  },

  messageRowOther: {
    backgroundColor: "rgba(255,255,255,0.035)",
    borderColor: "rgba(255,255,255,0.055)",
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.18)",
    overflow: "hidden",
    flexShrink: 0,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  messageContent: {
    flex: 1,
    minWidth: 0,
  },

  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 2,
  },

  userName: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
  },

  timestamp: {
    fontSize: 9,
    color: "rgba(255,255,255,0.22)",
  },

  messageText: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.68)",
  },

  likeButton: {
    minWidth: 24,
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    flexShrink: 0,
  },

  heartIcon: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.45,
  },

  heartIconActive: {
    opacity: 1,
  },

  likeCount: {
    fontSize: 9,
    color: "#FB7185",
    fontWeight: "700",
  },

  composer: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  input: {
    flex: 1,
    minHeight: 32,
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 5,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 18,
  },

  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
  },

  sendButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  pressed: {
    opacity: 0.72,
  },
});
