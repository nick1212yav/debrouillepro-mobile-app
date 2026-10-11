// src/features/sante/services/payment.service.ts
//
// SÉCURITÉ : `api.health.refundPayment` n'existe pas côté backend.
// `useRefundPayment` est conservé pour compatibilité mais échoue
// explicitement. `useProcessPayment` reste inchangé (endpoint légitime).

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function useProcessPayment() {
  const mutate = useMutation(api.health.processPayment);
  return async (data: unknown) => {
    try {
      const result = await mutate(data as never);
      toast.success("Paiement réussi");
      return result;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      throw e;
    }
  };
}

export function useRefundPayment() {
  return async (_transactionId: string): Promise<never> => {
    throw new Error(
      "Le remboursement Santé est en cours de migration vers DébrouillePay.",
    );
  };
}
