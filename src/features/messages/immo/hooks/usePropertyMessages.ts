// src/features/messages/immo/hooks/usePropertyMessages.ts

import { useCallback, useState } from "react";

import { useMutation, useQuery } from "convex/react";

import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

import type {
  PropertyId,
  PropertyRequestResult,
  PropertyWithMedia,
} from "../services/immo.service";

export interface UsePropertyMessagesOptions {
  propertyId?: PropertyId | null;
}

export interface UsePropertyMessagesResult {
  property: PropertyWithMedia | null | undefined;

  isLoading: boolean;
  isSendingRequest: boolean;

  error: string | null;
  requestSent: boolean;

  sendVisitRequest: (
    message: string,
    visitDate?: string,
  ) => Promise<PropertyRequestResult | null>;

  clearError: () => void;

  resetRequestState: () => void;
}

/**
 * Hook principal du module immobilier dans Messages.
 *
 * Backend :
 * - realestate.getPropertyWithMedia
 * - realestate.createPropertyRequest
 */
export function usePropertyMessages({
  propertyId,
}: UsePropertyMessagesOptions): UsePropertyMessagesResult {
  const property = useQuery(
    api.realestate.getPropertyWithMedia,
    propertyId
      ? {
          id: propertyId,
        }
      : "skip",
  ) as PropertyWithMedia | null | undefined;

  const createPropertyRequest = useMutation(
    api.realestate.createPropertyRequest,
  );

  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [requestSent, setRequestSent] = useState(false);

  const sendVisitRequest = useCallback(
    async (
      message: string,
      visitDate?: string,
    ): Promise<PropertyRequestResult | null> => {
      if (!propertyId) {
        setError("Aucun bien immobilier sélectionné.");

        return null;
      }

      const cleanMessage = message.trim();

      if (!cleanMessage) {
        setError("Veuillez saisir un message.");

        return null;
      }

      setIsSendingRequest(true);
      setError(null);

      try {
        const result = await createPropertyRequest({
          propertyId,
          message: cleanMessage,
          ...(visitDate?.trim()
            ? {
                visitDate: visitDate.trim(),
              }
            : {}),
        });

        setRequestSent(true);

        return {
          id: String(result),
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Impossible d'envoyer la demande de visite.";

        setError(message);

        return null;
      } finally {
        setIsSendingRequest(false);
      }
    },
    [propertyId, createPropertyRequest],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetRequestState = useCallback(() => {
    setRequestSent(false);
    setError(null);
  }, []);

  return {
    property,

    isLoading: property === undefined,

    isSendingRequest,

    error,
    requestSent,

    sendVisitRequest,

    clearError,
    resetRequestState,
  };
}

export default usePropertyMessages;
