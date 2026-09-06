// src/features/marketplace/hooks/useInventory.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";

export function useInventory() {
  const productsData = useQuery(api.commerce.listProducts, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  // ⚠️ updateStock n'existe pas dans l'API – utilisation de updateProduct à la place
  const updateProduct = useMutation(api.commerce.updateProduct);

  const products = (productsData?.page ?? []).map(adaptProduct);

  const updateStock = async (productId: string, stock: number) => {
    // Simuler la mise à jour du stock
    await updateProduct({ id: productId as any, stock });
  };

  return { products, updateStock, isLoading: productsData === undefined };
}
