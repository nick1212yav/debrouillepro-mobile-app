import { useState, useCallback } from "react";
import {
  MenuPerformance,
  type MenuItemSalesStat,
} from "../analytics/MenuPerformance";

export function useAnalytics() {
  const [isProcessing, setIsProcessing] = useState(false);

  const computeBCGMatrix = useCallback(
    (itemsSalesStats: MenuItemSalesStat[]) => {
      setIsProcessing(true);
      try {
        return MenuPerformance.compileBCGMatrix(itemsSalesStats);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { computeBCGMatrix, isProcessing };
}
