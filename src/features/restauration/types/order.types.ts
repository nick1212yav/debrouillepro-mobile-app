import { OrderStatus, PaymentGateway } from "./enums";

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDetail {
  id: string;
  restaurantId: number;
  restaurantName: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  deliveryAddress: string;
  paymentMethod: PaymentGateway | string;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryAt?: string;
  courierId?: string;
}
