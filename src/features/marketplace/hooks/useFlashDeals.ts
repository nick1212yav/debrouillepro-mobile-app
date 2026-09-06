// src/features/marketplace/hooks/useFlashDeals.ts
import { useState } from "react";

export function useFlashDeals() {
  const [flashDeals] = useState([]);
  return { flashDeals, isLoading: false };
}
