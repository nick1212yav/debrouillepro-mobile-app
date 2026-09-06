// src/features/marketplace/hooks/useLiveShopping.ts
import { useState } from "react";

export function useLiveShopping() {
  const [sessions] = useState([]);
  return { sessions, isLoading: false };
}
