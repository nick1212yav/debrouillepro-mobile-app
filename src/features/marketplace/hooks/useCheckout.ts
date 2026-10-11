// src/features/marketplace/hooks/useCheckout.ts
//
// SÉCURITÉ : `api.commerce.processPayment` a été neutralisé côté backend.
// Le hook n'expose plus `processPayment` : la commande est créée en
// `pending` et sera finalisée via le Payment Core.

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useCheckout() {
  const createOrder = useMutation(api.commerce.createOrder);

  const checkout = async (
    items: { productId: Id<"products">; quantity: number }[],
    deliveryAddress: string,
    note?: string,
  ) => {
    for (const item of items) {
      await createOrder({
        productId: item.productId,
        quantity: item.quantity,
        deliveryAddress,
        note,
      });
    }
  };

  return { checkout };
}
