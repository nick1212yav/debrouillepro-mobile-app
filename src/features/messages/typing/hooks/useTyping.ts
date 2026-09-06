import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { TypingUser } from "../services/typing.service";

const TYPING_DEBOUNCE_MS = 2000;
const CLEANUP_INTERVAL_MS = 5000;

export function useTyping(conversationId?: Id<"conversations">) {
  const { isAuthenticated } = useConvexAuth();

  const startTypingMutation = useMutation(api.messages.typing.startTyping);

  const stopTypingMutation = useMutation(api.messages.typing.stopTyping);

  const cleanupMutation = useMutation(api.messages.typing.cleanupExpired);

  const typingUsersQuery = useQuery(
    api.messages.typing.getTypingUsers,
    isAuthenticated && conversationId ? { conversationId } : "skip",
  );

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const isTypingRef = useRef(false);

  const stopTyping = useCallback(async () => {
    if (!conversationId || !isAuthenticated) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!isTypingRef.current) {
      return;
    }

    isTypingRef.current = false;

    try {
      await stopTypingMutation({
        conversationId,
      });
    } catch (error) {
      console.error("[useTyping] Impossible d'arrêter le typing:", error);
    }
  }, [conversationId, isAuthenticated, stopTypingMutation]);

  const startTyping = useCallback(async () => {
    if (!conversationId || !isAuthenticated) {
      return;
    }

    try {
      await startTypingMutation({
        conversationId,
      });

      isTypingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        void stopTyping();
      }, TYPING_DEBOUNCE_MS);
    } catch (error) {
      console.error("[useTyping] Impossible de signaler le typing:", error);
    }
  }, [conversationId, isAuthenticated, startTypingMutation, stopTyping]);

  const handleTyping = useCallback(() => {
    void startTyping();
  }, [startTyping]);

  useEffect(() => {
    if (!conversationId || !isAuthenticated) {
      return;
    }

    cleanupIntervalRef.current = setInterval(() => {
      void cleanupMutation({
        conversationId,
      });
    }, CLEANUP_INTERVAL_MS);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [conversationId, isAuthenticated, cleanupMutation]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (isTypingRef.current) {
        isTypingRef.current = false;

        if (conversationId && isAuthenticated) {
          void stopTypingMutation({
            conversationId,
          }).catch((error) => {
            console.error("[useTyping] Nettoyage du typing échoué:", error);
          });
        }
      }
    };
  }, [conversationId, isAuthenticated, stopTypingMutation]);

  const typingUsers = (typingUsersQuery ?? []) as TypingUser[];

  const isSomeoneTyping = typingUsers.length > 0;

  const typingText =
    typingUsers.length === 0
      ? ""
      : typingUsers.length === 1
        ? `${typingUsers[0].name} écrit…`
        : typingUsers.length === 2
          ? `${typingUsers[0].name} et ${typingUsers[1].name} écrivent…`
          : `${typingUsers.length} personnes écrivent…`;

  return {
    typingUsers,
    isSomeoneTyping,
    typingText,
    isLoading:
      isAuthenticated &&
      Boolean(conversationId) &&
      typingUsersQuery === undefined,

    startTyping,
    stopTyping,
    handleTyping,
  };
}

export default useTyping;
