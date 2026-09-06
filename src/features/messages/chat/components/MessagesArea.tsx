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
const LOAD_MORE_BATCH_SIZE = 30;

export function MessagesArea({
  messages,
  currentUserId,
  isLoadingMore = false,
  isDone = false,
  onLoadMore,
  onReply,
  onForward,
}: MessagesAreaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Empêche plusieurs appels simultanés à onLoadMore
   * avant que le parent ait eu le temps de mettre à jour
   * la prop isLoadingMore.
   */
  const loadMoreRequestedRef = useRef(false);

  useEffect(() => {
    if (!isLoadingMore) {
      loadMoreRequestedRef.current = false;
    }
  }, [isLoadingMore]);

  const tryLoadMore = useCallback(() => {
    const container = containerRef.current;

    if (
      !container ||
      !onLoadMore ||
      isLoadingMore ||
      isDone ||
      loadMoreRequestedRef.current
    ) {
      return;
    }

    if (container.scrollTop > LOAD_MORE_THRESHOLD) {
      return;
    }

    loadMoreRequestedRef.current = true;

    onLoadMore(LOAD_MORE_BATCH_SIZE);
  }, [isDone, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      tryLoadMore();
    };

    container.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [tryLoadMore]);

  /**
   * Si la zone de messages est trop courte pour produire
   * une barre de scroll, on vérifie également après le rendu
   * si davantage de messages peuvent être chargés.
   */
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (
      container.scrollHeight <= container.clientHeight &&
      !isLoadingMore &&
      !isDone
    ) {
      tryLoadMore();
    }
  }, [messages.length, isDone, isLoadingMore, tryLoadMore]);

  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {isLoadingMore && (
        <div className="mb-4 text-center text-xs text-white/30">
          Chargement des anciens messages...
        </div>
      )}

      <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-2">
        {messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={String(message._id)}
              message={message}
              currentUserId={currentUserId}
              onReply={onReply}
              onForward={onForward}
            />
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-white/30">
            Aucun message.
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesArea;
