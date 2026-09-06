import { useState, useCallback } from "react";
import {
  PaymentService,
  type CheckoutSessionPayload,
} from "../payments/PaymentService";

export function usePayment() {
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = useCallback(
    async (payload: CheckoutSessionPayload) => {
      setIsProcessing(true);
      try {
        return await PaymentService.executeCheckout(payload);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { processPayment, isProcessing };
}
