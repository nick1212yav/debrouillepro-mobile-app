// src/features/marketplace/hooks/useInstallments.ts
import { useState } from "react";

export function useInstallments(price: number) {
  const [installments] = useState([
    { months: 3, interest: 0, monthly: price / 3 },
    { months: 6, interest: 5, monthly: (price * 1.05) / 6 },
  ]);
  return {
    installments,
    minMonthly: installments[0]?.monthly || 0,
    isLoading: false,
  };
}
