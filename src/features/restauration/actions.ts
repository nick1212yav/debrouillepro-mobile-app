import type { OrderStatus, TableSection } from "./subtypes";

export interface CreateOrderPayload {
  restaurantId: number;
  userId: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  deliveryAddress: string;
  paymentMethod: "mobile_money" | "wave" | "card" | "cash";
}

export interface CreateBookingPayload {
  restaurantId: number;
  userId: string;
  bookingDate: string; // "2026-08-15"
  bookingTime: string; // "20:00"
  guests: number;
  section: TableSection;
}

export class RestaurationActions {
  /**
   * Soumet une commande de nourriture au système central
   */
  public static async executeCreateOrder(
    payload: CreateOrderPayload,
  ): Promise<{ orderId: string; status: OrderStatus; total: number }> {
    const subTotal = payload.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const deliveryFee = 1500; // Frais fixes de simulation
    const total = subTotal + deliveryFee;

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      orderId,
      status: "received" as OrderStatus,
      total,
    };
  }

  /**
   * Planifie et confirme une réservation de table
   */
  public static async executeTableReservation(
    payload: CreateBookingPayload,
  ): Promise<{ bookingId: string; tableNumber: number }> {
    const bookingId = `RES-${Math.floor(10000 + Math.random() * 90000)}`;
    const tableNumber = Math.floor(1 + Math.random() * 45);

    return {
      bookingId,
      tableNumber,
    };
  }
}
