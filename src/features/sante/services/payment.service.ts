// src/features/sante/services/payment.service.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

export function useProcessPayment() {
  const mutate = useMutation(api.health.processPayment);
  return async (data: any) => {
    try {
      const result = await mutate(data);
      toast.success("Paiement réussi");
      return result;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      throw e;
    }
  };
}

export function useRefundPayment() {
  const mutate = useMutation(api.health.refundPayment);
  return async (transactionId: string) => {
    try {
      await mutate({ transactionId });
      toast.success("Remboursement effectué");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      throw e;
    }
  };
}
