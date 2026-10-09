// src/features/messages/payments/hooks/useMessagePayments.ts

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";

import { api } from "@/convex/_generated/api";

export type PaymentStatus = "idle" | "processing" | "succeeded" | "failed";

/**
 * Contrat exact généré par Convex pour
 * createPaymentIntent.
 */
type CreatePaymentIntentArgs = FunctionArgs<
  typeof api.payments.createPaymentIntent
>;

/**
 * Contrat public du module Messages.
 *
 * Le type de paiement est imposé à
 * "peer_transfer" par ce hook.
 */
export type MessagePaymentInput = Omit<CreatePaymentIntentArgs, "type">;

export interface UseMessagePaymentsResult {
  isLoading: boolean;
  error: string | null;
  status: PaymentStatus;
  processPayment: (input: MessagePaymentInput) => Promise<string | null>;
  clear: () => void;
}

export function useMessagePayments(): UseMessagePaymentsResult {
  const createPaymentIntent = useMutation(api.payments.createPaymentIntent);

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

      if (typeof input.currency !== "string" || !input.currency.trim()) {
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
