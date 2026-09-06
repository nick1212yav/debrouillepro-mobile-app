import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityPayments.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCommunityPayments() {
  const processPayment = useMutation(api.community.processPayment);
  const createPaymentIntent = useMutation(api.community.createPaymentIntent);
  const confirmPayment = useMutation(api.community.confirmPayment);

  return {
    processPayment: async (data: {
      amount: number;
      currency: string;
      source: string;
      description?: string;
      metadata?: any;
    }) => {
      try {
        const result = await processPayment(data);
        UIService.openToast("Paiement effectué", "success");
        return result;
      } catch (error) {
        UIService.openToast("Erreur lors du paiement", "error");
        throw error;
      }
    },
    createPaymentIntent: async (data: {
      amount: number;
      currency: string;
      description?: string;
      metadata?: any;
    }) => {
      try {
        const intent = await createPaymentIntent(data);
        return intent;
      } catch (error) {
        UIService.openToast("Erreur lors de la création de l'intention de paiement", "error");
        throw error;
      }
    },
    confirmPayment: async (paymentIntentId: string) => {
      try {
        const result = await confirmPayment({ paymentIntentId });
        UIService.openToast("Paiement confirmé", "success");
        return result;
      } catch (error) {
        UIService.openToast("Erreur lors de la confirmation du paiement", "error");
        throw error;
      }
    },
  };
}
