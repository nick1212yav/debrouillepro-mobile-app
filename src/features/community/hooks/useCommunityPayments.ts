// src/features/community/hooks/useCommunityPayments.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

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
        toast.success("Paiement effectué");
        return result;
      } catch (error) {
        toast.error("Erreur lors du paiement");
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
        toast.error("Erreur lors de la création de l'intention de paiement");
        throw error;
      }
    },
    confirmPayment: async (paymentIntentId: string) => {
      try {
        const result = await confirmPayment({ paymentIntentId });
        toast.success("Paiement confirmé");
        return result;
      } catch (error) {
        toast.error("Erreur lors de la confirmation du paiement");
        throw error;
      }
    },
  };
}
