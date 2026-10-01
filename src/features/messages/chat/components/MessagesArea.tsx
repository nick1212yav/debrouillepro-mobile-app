// src/features/messages/chat/components/MessagesArea.tsx

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView as ScrollViewType,
} from "react-native";
import { useCallback, useEffect, useRef } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import type { Message } from "../services/chat.service";
import { MessageBubble } from "./MessageBubble";

interface MessagesAreaProps {
  messages: Message[];
  currentUserId: Id<"users">;

  isLoadingMore?: boolean;
  isDone?: boolean;

  onLoadMore?: (numItems?: number) => void;

  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

const LOAD_MORE_THRESHOLD = 120;
const RESET_LOAD_THRESHOLD = 220;
const BOTTOM_THRESHOLD = 180;
const LOAD_BATCH_SIZE = 30;

export function MessagesArea({
  messages,
  currentUserId,
  isLoadingMore = false,
  isDone = false,
  onLoadMore,
  onReply,
  onForward,
}: MessagesAreaProps) {
  const scrollRef = useRef<ScrollViewType>(null);

  const hasTriggeredLoadMoreRef = useRef(false);
  const hasInitialScrollRef = useRef(false);
  const wasLoadingMoreRef = useRef(false);

  const isNearBottomRef = useRef(true);

  /**
   * Maintient la position du lecteur :
   * - bas de conversation → on peut suivre les nouveaux messages
   * - lecture ancienne → ne pas forcer le scroll
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      const offsetY = Math.max(contentOffset.y, 0);

      const distanceFromBottom =
        contentSize.height - (offsetY + layoutMeasurement.height);

      isNearBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD;

      /**
       * Arrivé en haut :
       * demander les anciens messages une seule fois
       * jusqu'à ce que l'utilisateur redescende.
       */
      if (offsetY > RESET_LOAD_THRESHOLD) {
        hasTriggeredLoadMoreRef.current = false;
      }

      if (
        offsetY <= LOAD_MORE_THRESHOLD &&
        !hasTriggeredLoadMoreRef.current &&
        !isLoadingMore &&
        !isDone &&
        onLoadMore
      ) {
        hasTriggeredLoadMoreRef.current = true;
        wasLoadingMoreRef.current = true;

        onLoadMore(LOAD_BATCH_SIZE);
      }
    },
    [isLoadingMore, isDone, onLoadMore],
  );

  /**
   * Premier affichage :
   * une conversation doit s'ouvrir sur les derniers messages,
   * comme une vraie application de messagerie.
   */
  const handleContentSizeChange = useCallback(
    (_width: number, _height: number) => {
      if (!scrollRef.current || messages.length === 0) {
        return;
      }

      if (!hasInitialScrollRef.current) {
        hasInitialScrollRef.current = true;

        requestAnimationFrame(() => {
          scrollRef.current?.scrollToEnd({
            animated: false,
          });
        });

        return;
      }

      /**
       * Si la modification provient du chargement des anciens messages,
       * surtout ne pas renvoyer l'utilisateur au dernier message.
       */
      if (wasLoadingMoreRef.current) {
        wasLoadingMoreRef.current = false;
        return;
      }

      /**
       * Nouveaux messages :
       * seulement si l'utilisateur était déjà proche du bas.
       */
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollToEnd({
            animated: true,
          });
        });
      }
    },
    [messages.length],
  );

  /**
   * Si le chargement initial arrive après le premier rendu,
   * on s'assure que la conversation arrive bien en bas.
   */
  useEffect(() => {
    if (messages.length === 0) {
      hasInitialScrollRef.current = false;
    }
  }, [messages.length]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        messages.length === 0 && styles.emptyContent,
      ]}
      onScroll={handleScroll}
      onContentSizeChange={handleContentSizeChange}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      overScrollMode="never"
      contentInsetAdjustmentBehavior="automatic"
    >
      {isLoadingMore && (
        <View
          style={styles.loadingRow}
          accessibilityLabel="Chargement des anciens messages"
          accessibilityRole="progressbar"
        >
          <View style={styles.loadingPill}>
            <Text style={styles.loadingText}>
              Chargement des anciens messages…
            </Text>
          </View>
        </View>
      )}

      <View style={styles.list}>
        {messages.map((message) => (
          <MessageBubble
            key={String(message._id)}
            message={message}
            currentUserId={currentUserId}
            onReply={onReply}
            onForward={onForward}
          />
        ))}

        {messages.length === 0 && (
          <View
            style={styles.empty}
            accessibilityRole="text"
            accessibilityLabel="Aucun message"
          >
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>✦</Text>
            </View>

            <Text style={styles.emptyTitle}>Aucun message</Text>

            <Text style={styles.emptyText}>
              Commencez la conversation en envoyant votre premier message.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    backgroundColor: "#000000",
  },

  content: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 12,
  },

  emptyContent: {
    justifyContent: "center",
  },

  list: {
    width: "100%",
    maxWidth: 768,
    alignSelf: "center",
    gap: 8,
  },

  loadingRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    paddingBottom: 12,
  },

  loadingPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },

  loadingText: {
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },

  empty: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },

  emptyIconText: {
    fontSize: 22,
    color: "rgba(255,255,255,0.65)",
  },

  emptyTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 7,
  },

  emptyText: {
    maxWidth: 320,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.42)",
    textAlign: "center",
  },
});

export default MessagesArea;
