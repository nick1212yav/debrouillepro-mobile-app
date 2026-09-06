import { useState, useCallback } from "react";
import { MenuService } from "../services/MenuService";
import type { MenuItem } from "../types/menu.types";

export function useMenu() {
  const [isProcessing, setIsProcessing] = useState(false);

  const addCategory = useCallback(
    async (restaurantId: number, name: string): Promise<boolean> => {
      setIsProcessing(true);
      try {
        return await MenuService.addCategory(restaurantId, name);
      } catch {
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const addMenuItem = useCallback(
    async (
      restaurantId: number,
      categoryName: string,
      itemData: Partial<MenuItem>,
    ) => {
      setIsProcessing(true);
      try {
        return await MenuService.addMenuItem(
          restaurantId,
          categoryName,
          itemData,
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { addCategory, addMenuItem, isProcessing };
}
