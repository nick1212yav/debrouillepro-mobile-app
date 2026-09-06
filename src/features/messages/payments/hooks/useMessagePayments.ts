// src/features/messages/payments/hooks/useMessagePayments.ts

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

export type PaymentStatus = "idle" | "processing" | "succeeded" | "failed";

export interface PaymentMethodsResult {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ProcessPaymentResult {
  success: boolean;
}

export interface UseMessagePaymentsResult {
  isLoading: boolean;
  error: string | null;

  paymentMethods: PaymentMethodsResult[];

  payment: ProcessPaymentResult | null;

  status: PaymentStatus;

  processPayment: (
    orderId: Id<"orders">,
    amount: number,
    currency: string,
    method: string,
    providerData?: unknown,
  ) => Promise<ProcessPaymentResult | null>;

  clear: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMessagePayments(): UseMessagePaymentsResult {
  // --------------------------------------------------------------------------
  // BACKEND — MOYENS DE PAIEMENT
  // --------------------------------------------------------------------------

  const paymentMethods = useQuery(api.payments.getPaymentMethods) ?? [];

  // --------------------------------------------------------------------------
  // BACKEND — TRAITEMENT DU PAIEMENT
  // --------------------------------------------------------------------------

  const processPaymentMutation = useMutation(api.payments.processPayment);

  // --------------------------------------------------------------------------
  // ÉTAT LOCAL
  // --------------------------------------------------------------------------

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [payment, setPayment] = useState<ProcessPaymentResult | null>(null);

  const [status, setStatus] = useState<PaymentStatus>("idle");

  // --------------------------------------------------------------------------
  // EXECUTEUR CENTRAL
  // --------------------------------------------------------------------------

  const execute = useCallback(
    async (
      operation: () => Promise<ProcessPaymentResult>,
    ): Promise<ProcessPaymentResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await operation();

        setPayment(result);

        if (result.success) {
          setStatus("succeeded");
        } else {
          setStatus("failed");
        }

        return result;
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
    [],
  );

  // ==========================================================================
  // TRAITER UN PAIEMENT
  // ==========================================================================

  const processPayment = useCallback(
    async (
      orderId: Id<"orders">,
      amount: number,
      currency: string,
      method: string,
      providerData?: unknown,
    ): Promise<ProcessPaymentResult | null> => {
      // ----------------------------------------------------------------------
      // Validation
      // ----------------------------------------------------------------------

      if (!orderId) {
        setError("La commande est obligatoire.");
        setStatus("failed");

        return null;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Le montant du paiement doit être supérieur à zéro.");
        setStatus("failed");

        return null;
      }

      if (!currency.trim()) {
        setError("La devise du paiement est obligatoire.");
        setStatus("failed");

        return null;
      }

      if (!method.trim()) {
        setError("Le moyen de paiement est obligatoire.");
        setStatus("failed");

        return null;
      }

      // ----------------------------------------------------------------------
      // Traitement
      // ----------------------------------------------------------------------

      setStatus("processing");

      return execute(() =>
        processPaymentMutation({
          orderId,
          amount,
          currency,
          method,
          providerData,
        }),
      );
    },
    [execute, processPaymentMutation],
  );

  // ==========================================================================
  // RESET
  // ==========================================================================

  const clear = useCallback(() => {
    setError(null);
    setPayment(null);
    setStatus("idle");
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    isLoading,
    error,

    paymentMethods,

    payment,

    status,

    processPayment,

    clear,
  };
}

export default useMessagePayments;
