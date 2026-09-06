import { useState, useCallback } from "react";
import { OrderService } from "../services/OrderService";
import type { OrderDetail, OrderItem } from "../types/order.types";
import { OrderStatus, PaymentGateway } from "../types/enums";

export function useOrder() {
  const [isProcessing, setIsProcessing] = useState(false);

  const placeOrder = useCallback(
    async (data: {
      restaurantId: number;
      userId: string;
      items: OrderItem[];
      deliveryAddress: string;
      paymentMethod: PaymentGateway | string;
    }) => {
      setIsProcessing(true);
      try {
        return await OrderService.createOrder(data);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<boolean> => {
      setIsProcessing(true);
      try {
        return await OrderService.updateStatus(orderId, status);
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { placeOrder, updateOrderStatus, isProcessing };
}
