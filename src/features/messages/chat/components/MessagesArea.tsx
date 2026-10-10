// src/features/messages/chat/components/MessagesArea.tsx

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
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

/**
 * Fenêtre pendant laquelle toute variation de hauteur du contenu (chargement
 * d'image, layout de média, etc.) déclenche un scroll inconditionnel vers le
 * bas. Basé sur le temps, pas sur un nombre de frames, car une image met
 * souvent 500 ms à 2 s à charger.
 */
const INITIAL_SETTLING_WINDOW_MS = 2500;

/**
 * Durée pendant laquelle on ignore les événements de scroll après un
 * scrollToEnd programmatique. Sans ce garde-fou, l'événement virtuel émis
 * par notre propre scrollToEnd est confondu avec un scroll utilisateur et
 * désactive le suivi du bas.
 */
const PROGRAMMATIC_SCROLL_LOCK_MS = 600;

const scrollToBottom = (
  scrollRef: React.RefObject<ScrollViewType | null>,
  animated: boolean,
) => {
  requestAnimationFrame(() => {
    scrollRef.current?.scrollToEnd({ animated });

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });

      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated });
      });
    });
  });
};

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

  const shouldFollowBottomRef = useRef(true);
  const hasUserScrolledRef = useRef(false);
  const initialSettlingRef = useRef(true);

  const lastContentHeightRef = useRef(0);

  const programmaticScrollUntilRef = useRef(0);
  const initialLayoutTimeRef = useRef(0);

  const forceScrollToBottom = useCallback((animated: boolean) => {
    programmaticScrollUntilRef.current =
      Date.now() + PROGRAMMATIC_SCROLL_LOCK_MS;

    scrollToBottom(scrollRef, animated);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Ignore les events émis par nos propres scrollToEnd.
      if (Date.now() < programmaticScrollUntilRef.current) {
        return;
      }

      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;

      const offsetY = Math.max(contentOffset.y, 0);

      const distanceFromBottom = Math.max(
        0,
        contentSize.height - (offsetY + layoutMeasurement.height),
      );

      const isNearBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

      hasUserScrolledRef.current = true;

      if (initialSettlingRef.current) {
        shouldFollowBottomRef.current = true;
      } else {
        shouldFollowBottomRef.current = isNearBottom;
      }

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

  const handleLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      if (messages.length === 0) {
        return;
      }

      if (!hasInitialScrollRef.current) {
        hasInitialScrollRef.current = true;
        shouldFollowBottomRef.current = true;
        hasUserScrolledRef.current = false;
        initialSettlingRef.current = true;
        initialLayoutTimeRef.current = Date.now();

        forceScrollToBottom(false);

        requestAnimationFrame(() => {
          forceScrollToBottom(false);

          requestAnimationFrame(() => {
            forceScrollToBottom(false);
          });
        });
      }
    },
    [forceScrollToBottom, messages.length],
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      const previousHeight = lastContentHeightRef.current;
      lastContentHeightRef.current = height;

      if (!scrollRef.current || messages.length === 0) {
        return;
      }

      if (wasLoadingMoreRef.current) {
        wasLoadingMoreRef.current = false;
        return;
      }

      if (!hasInitialScrollRef.current) {
        hasInitialScrollRef.current = true;
        shouldFollowBottomRef.current = true;
        hasUserScrolledRef.current = false;
        initialSettlingRef.current = true;
        initialLayoutTimeRef.current = Date.now();

        forceScrollToBottom(false);

        requestAnimationFrame(() => {
          forceScrollToBottom(false);
        });

        return;
      }

      const timeSinceInitial = Date.now() - initialLayoutTimeRef.current;

      const inSettlingWindow =
        initialSettlingRef.current ||
        (timeSinceInitial < INITIAL_SETTLING_WINDOW_MS &&
          !hasUserScrolledRef.current);

      if (inSettlingWindow) {
        forceScrollToBottom(false);
        return;
      }

      if (height === previousHeight) {
        return;
      }

      if (shouldFollowBottomRef.current) {
        forceScrollToBottom(true);
      }
    },
    [forceScrollToBottom, messages.length],
  );

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      initialSettlingRef.current = false;
    }, INITIAL_SETTLING_WINDOW_MS);

    return () => clearTimeout(timer);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0) {
      hasInitialScrollRef.current = false;
      shouldFollowBottomRef.current = true;
      hasUserScrolledRef.current = false;
      initialSettlingRef.current = true;
      lastContentHeightRef.current = 0;
      initialLayoutTimeRef.current = 0;
      programmaticScrollUntilRef.current = 0;
    }
  }, [messages.length]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    if (
      hasInitialScrollRef.current &&
      !wasLoadingMoreRef.current &&
      shouldFollowBottomRef.current
    ) {
      forceScrollToBottom(true);
    }
  }, [forceScrollToBottom, messages.length]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        messages.length === 0 && styles.emptyContent,
      ]}
      onScroll={handleScroll}
      onLayout={handleLayout}
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
    borderColor: "rgba(255,255,255,0.1)",
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
