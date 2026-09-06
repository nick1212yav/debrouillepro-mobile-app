import { Alert } from "react-native";

// src/features/marketplace/hooks/useCompare.ts
import { useState } from "react";
import type { Product } from "../types";

export function useCompare() {
  const [compareList, setCompareList] = useState<string[]>([]);

  const add = (productId: string) => {
    if (compareList.length >= 4) {
      Alert.alert("Vous ne pouvez comparer que 4 produits");
      return;
    }
    if (!compareList.includes(productId)) {
      setCompareList([...compareList, productId]);
    }
  };

  const remove = (productId: string) => {
    setCompareList(compareList.filter((id) => id !== productId));
  };

  const clear = () => setCompareList([]);

  return {
    compareList,
    add,
    remove,
    clear,
    count: compareList.length,
  };
}
