import type { OrderDetail, OrderItem } from "../types/order.types";
import { OrderStatus, PaymentGateway } from "../types/enums";
import { OrderValidator } from "../validators/order.validator";
import { RestaurantService } from "./RestaurantService";
import { LiveOrderTracker } from "../tracking/LiveOrderTracker";
import { NotificationService } from "./NotificationService";

export class OrderService {
  private static activeOrders: Map<string, OrderDetail> = new Map();
  private static trackers: Map<string, LiveOrderTracker> = new Map();

  public static async createOrder(data: {
    restaurantId: number;
    userId: string;
    items: OrderItem[];
    deliveryAddress: string;
    paymentMethod: PaymentGateway | string;
  }) {
    const validation = OrderValidator.validate(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const restaurant = await RestaurantService.getById(data.restaurantId);
    if (!restaurant) {
      return {
        success: false,
        errors: { global: "Établissement de restauration introuvable." },
      };
    }

    const subtotal = data.items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );
    const tax = Math.round(subtotal * 0.05);
    const deliveryFee = restaurant.deliveryFee;
    const total = subtotal + tax + deliveryFee;

    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order: OrderDetail = {
      id: orderId,
      restaurantId: data.restaurantId,
      restaurantName: restaurant.name,
      userId: data.userId,
      items: data.items,
      subtotal,
      deliveryFee,
      tax,
      total,
      deliveryAddress: data.deliveryAddress,
      paymentMethod: data.paymentMethod,
      status: OrderStatus.RECEIVED,
      createdAt: new Date().toISOString(),
    };

    this.activeOrders.set(orderId, order);

    const tracker = new LiveOrderTracker(orderId, OrderStatus.RECEIVED);
    this.trackers.set(orderId, tracker);

    await NotificationService.sendSMS(
      data.userId,
      `Votre commande ${orderId} chez ${restaurant.name} a été validée.`,
    );
    await NotificationService.sendPushNotification(
      "restaurant_channel",
      `Nouvelle commande reçue ! ID: ${orderId}`,
    );

    return { success: true, order };
  }

  public static async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<boolean> {
    const order = this.activeOrders.get(orderId);
    if (!order) return false;

    order.status = newStatus;
    this.activeOrders.set(orderId, order);

    const tracker = this.trackers.get(orderId);
    if (tracker) {
      tracker.updateStatus(newStatus);
    }

    if (newStatus === OrderStatus.PREPARING) {
      await NotificationService.sendSMS(
        order.userId,
        `Chef en cuisine ! Votre commande ${orderId} est en préparation.`,
      );
    } else if (newStatus === OrderStatus.READY_FOR_PICKUP) {
      await NotificationService.sendSMS(
        order.userId,
        `Votre commande ${orderId} est prête.`,
      );
    }

    return true;
  }

  public static async getOrder(orderId: string): Promise<OrderDetail | null> {
    return this.activeOrders.get(orderId) || null;
  }
}
