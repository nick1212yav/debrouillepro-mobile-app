// src/features/marketplace/hooks/useCheckout.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useCheckout() {
  const createOrder = useMutation(api.commerce.createOrder);
  const processPayment = useMutation(api.commerce.processPayment);

  const checkout = async (
    items: { productId: Id<"products">; quantity: number }[],
    deliveryAddress: string,
    note?: string,
  ) => {
    // Créer les commandes (une par produit pour simplifier)
    for (const item of items) {
      await createOrder({
        productId: item.productId,
        quantity: item.quantity,
        deliveryAddress,
        note,
      });
    }
  };

  return {
    checkout,
    processPayment,
  };
}
