// src/features/marketplace/hooks/useMarketplaceNotifications.ts
import { useState } from "react";

export function useMarketplaceNotifications() {
  const [notifications] = useState([]);
  return { notifications, isLoading: false };
}
