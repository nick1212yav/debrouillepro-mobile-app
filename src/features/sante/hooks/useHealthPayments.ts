// src/features/sante/hooks/useHealthPayments.ts

import { toast } from "sonner";

export interface HealthPaymentInput {
  amount: number;
  currency: string;
  description?: string;
  referenceId?: string;
}

const PAYMENT_MIGRATION_MESSAGE =
  "Le paiement Santé est en cours de migration vers DébrouillePay.";

export function useProcessPayment() {
  return async (_data: HealthPaymentInput): Promise<never> => {
    toast.info(PAYMENT_MIGRATION_MESSAGE);
    throw new Error(PAYMENT_MIGRATION_MESSAGE);
  };
}
