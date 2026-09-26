// src/features/messages/payments/hooks/useMessagePayments.ts

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";

import { api } from "@/convex/_generated/api";

export type PaymentStatus = "idle" | "processing" | "succeeded" | "failed";

/**
 * Arguments exacts attendus par la mutation createPaymentIntent
 * (extraits directement du contrat généré par Convex).
 */
type CreatePaymentIntentArgs = FunctionArgs<
  typeof api.payments.createPaymentIntent
>;

/**
 * Entrée publique : identique à createPaymentIntent,
 * sauf "type" qui est figé à "peer_transfer" côté hook Messages.
 */
export type MessagePaymentInput = Omit<CreatePaymentIntentArgs, "type">;

export interface UseMessagePaymentsResult {
  isLoading: boolean;
  error: string | null;
  status: PaymentStatus;
  /**
   * Crée une intention de paiement de type peer_transfer.
   * Retourne l'ID Convex de l'intention ou null en cas d'échec.
   */
  processPayment: (
    input: MessagePaymentInput,
  ) => Promise<string | null>;
  clear: () => void;
}

export function useMessagePayments(): UseMessagePaymentsResult {
  const createPaymentIntent = useMutation(
    api.payments.createPaymentIntent,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("idle");

  const processPayment = useCallback(
    async (input: MessagePaymentInput): Promise<string | null> => {
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        setError("Le montant du paiement doit être supérieur à zéro.");
        setStatus("failed");
        return null;
      }

      if (!input.currency.trim()) {
        setError("La devise du paiement est obligatoire.");
        setStatus("failed");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setStatus("processing");

      try {
        const result = await createPaymentIntent({
          ...input,
          type: "peer_transfer",
        });

        setStatus("succeeded");
        return String(result);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Une erreur de paiement est survenue.";

        setError(message);
        setStatus("failed");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [createPaymentIntent],
  );

  const clear = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);

  return {
    isLoading,
    error,
    status,
    processPayment,
    clear,
  };
}

export default useMessagePayments;