// src/features/marketplace/hooks/useOrders.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptOrder } from "../adapter";
import type { OrderStatus } from "../types";

export function useOrders(role: "buyer" | "seller" = "buyer") {
  const ordersData = useQuery(api.commerce.getMyOrders, { role });

  const updateStatus = useMutation(api.commerce.updateOrderStatus);

  const orders = (ordersData ?? []).map(adaptOrder);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Convertir OrderStatus en type accepté par Convex
    const validStatus = status as
      | "confirmed"
      | "shipped"
      | "delivered"
      | "cancelled"
      | "refunded";
    await updateStatus({ id: orderId as any, status: validStatus });
  };

  return { orders, updateOrderStatus, isLoading: ordersData === undefined };
}
