// src/features/messages/payments/services/payments.service.ts

import { toast } from "sonner";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface PaymentData {
  id?: string;
  paymentIntentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description?: string;
}

export interface CreateMessagePaymentInput {
  amount: number;
  currency: string;
  description?: string;
}

const PAYMENT_MIGRATION_MESSAGE =
  "Le paiement Messages est en cours de migration vers DébrouillePay.";

export function useProcessPayment() {
  return async (_data: CreateMessagePaymentInput): Promise<never> => {
    toast.info(PAYMENT_MIGRATION_MESSAGE);
    throw new Error(PAYMENT_MIGRATION_MESSAGE);
  };
}

export function useRefundPayment() {
  return async (_transactionId: string): Promise<never> => {
    const message =
      "Le remboursement Messages est en cours de migration vers DébrouillePay.";

    toast.info(message);
    throw new Error(message);
  };
}
