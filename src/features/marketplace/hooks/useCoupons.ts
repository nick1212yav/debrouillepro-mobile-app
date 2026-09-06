// src/features/marketplace/hooks/useCoupons.ts
import { useState } from "react";

export function useCoupons() {
  const [coupons, setCoupons] = useState([
    {
      id: "1",
      code: "WELCOME",
      discount: 10,
      type: "percentage",
      description: "10% de réduction",
      expiresAt: "2025-12-31",
      minPurchase: 0,
    },
  ]);

  return { coupons, isLoading: false };
}
