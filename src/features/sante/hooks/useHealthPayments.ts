import { UIService } from "@/core/sdk/ui/UIService";

// src/features/sante/hooks/useHealthPayments.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useProcessPayment() {
  const mutate = useMutation(api.health.processPayment);
  return async (data: any) => {
    try {
      const result = await mutate(data);
      UIService.openToast("Paiement réussi", "success");
      return result;
    } catch (e) {
      UIService.openToast(e instanceof Error ? e.message : "Erreur", "error");
      throw e;
    }
  };
}
