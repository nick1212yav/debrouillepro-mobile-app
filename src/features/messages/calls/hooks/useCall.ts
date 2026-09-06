// src/features/messages/calls/hooks/useCall.ts

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { callService } from "../services/call.service";
import type { CallType } from "../types/call.types";

interface UseCallOptions {
  conversationId?: Id<"conversations">;
  callId?: Id<"calls">;
}

export function useCall({ conversationId, callId }: UseCallOptions = {}) {
  const { isAuthenticated } = useConvexAuth();

  const [error, setError] = useState<string | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);

  // ==========================================================================
  // MUTATIONS CONVEX
  // ==========================================================================

  const startCallMutation = useMutation(api.messages.calls.startCall);

  const answerCallMutation = useMutation(api.messages.calls.answerCall);

  const rejectCallMutation = useMutation(api.messages.calls.rejectCall);

  const endCallMutation = useMutation(api.messages.calls.endCall);

  const missedCallMutation = useMutation(api.messages.calls.markAsMissed);

  const cleanupMutation = useMutation(api.messages.calls.cleanupStaleCalls);

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  const activeCall = useQuery(
    api.messages.calls.getActiveCall,
    isAuthenticated && conversationId ? { conversationId } : "skip",
  );

  const call = useQuery(
    api.messages.calls.getCall,
    isAuthenticated && callId ? { callId } : "skip",
  );

  // ==========================================================================
  // START CALL
  // ==========================================================================
  //
  // Le backend Convex expose actuellement `status` comme `string`.
  // Le service de calls attend, pour le résultat initial, le statut
  // littéral `"pending"`.
  //
  // On normalise donc ici la réponse de la mutation à la frontière
  // Convex -> service, sans cast dangereux.
  // ==========================================================================

  const startCall = useCallback(
    async (type: CallType) => {
      if (!conversationId) {
        throw new Error("Aucune conversation sélectionnée.");
      }

      setError(null);

      try {
        const normalizedStartCallMutation = async (args: {
          conversationId: Id<"conversations">;
          type: "audio" | "video";
        }) => {
          const result = await startCallMutation(args);

          return {
            ...result,
            status: "pending" as const,
          };
        };

        return await callService.startCall(
          normalizedStartCallMutation,
          conversationId,
          type,
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Impossible de démarrer l'appel.";

        setError(message);
        throw err;
      }
    },
    [conversationId, startCallMutation],
  );

  // ==========================================================================
  // ANSWER CALL
  // ==========================================================================

  const answerCall = useCallback(
    async (targetCallId?: Id<"calls">) => {
      const id = targetCallId ?? callId;

      if (!id) {
        throw new Error("Aucun appel sélectionné.");
      }

      setError(null);

      try {
        return await callService.answerCall(answerCallMutation, id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible d'accepter l'appel.",
        );

        throw err;
      }
    },
    [answerCallMutation, callId],
  );

  // ==========================================================================
  // REJECT CALL
  // ==========================================================================

  const rejectCall = useCallback(
    async (targetCallId?: Id<"calls">) => {
      const id = targetCallId ?? callId;

      if (!id) {
        throw new Error("Aucun appel sélectionné.");
      }

      setError(null);

      try {
        return await callService.rejectCall(rejectCallMutation, id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Impossible de refuser l'appel.",
        );

        throw err;
      }
    },
    [callId, rejectCallMutation],
  );

  // ==========================================================================
  // END CALL
  // ==========================================================================

  const endCall = useCallback(
    async (targetCallId?: Id<"calls">) => {
      const id = targetCallId ?? callId;

      if (!id) {
        return null;
      }

      setError(null);

      try {
        return await callService.endCall(endCallMutation, id);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de terminer l'appel.",
        );

        throw err;
      }
    },
    [callId, endCallMutation],
  );

  // ==========================================================================
  // MARK AS MISSED
  // ==========================================================================

  const markAsMissed = useCallback(
    async (targetCallId?: Id<"calls">) => {
      const id = targetCallId ?? callId;

      if (!id) {
        return null;
      }

      setError(null);

      try {
        return await callService.markAsMissed(missedCallMutation, id);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de marquer l'appel comme manqué.",
        );

        throw err;
      }
    },
    [callId, missedCallMutation],
  );

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  const cleanupStaleCalls = useCallback(async () => {
    if (!conversationId) {
      return null;
    }

    try {
      return await callService.cleanupStaleCalls(
        cleanupMutation,
        conversationId,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de nettoyer les appels expirés.",
      );

      throw err;
    }
  }, [cleanupMutation, conversationId]);

  // ==========================================================================
  // AUTO CLEANUP
  // ==========================================================================

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    void cleanupStaleCalls();
  }, [conversationId, cleanupStaleCalls]);

  // ==========================================================================
  // CURRENT CALL
  // ==========================================================================

  const currentCall = useMemo(
    () => call ?? activeCall ?? null,
    [activeCall, call],
  );

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    call: currentCall,

    activeCall: activeCall ?? null,

    isLoading:
      (callId !== undefined && call === undefined) ||
      (conversationId !== undefined && activeCall === undefined),

    error,

    isMinimized,

    setIsMinimized,

    startCall,
    answerCall,
    rejectCall,
    endCall,
    markAsMissed,
    cleanupStaleCalls,
  };
}

export default useCall;
