import type { OrderDetail } from "../types/order.types";
import { OrderStatus } from "../types/enums";

export class OrderingPolicy {
  private static readonly CANCELLATION_TIME_LIMIT_MS = 300000;
  private static readonly MAXIMUM_DELIVERY_RADIUS_KM = 15;

  public static isEligibleForCancellation(order: OrderDetail): {
    eligible: boolean;
    reason?: string;
  } {
    if (
      order.status !== OrderStatus.RECEIVED &&
      order.status !== OrderStatus.PENDING_PAYMENT
    ) {
      return {
        eligible: false,
        reason:
          "La commande est déjà entrée en phase de préparation ou d'acheminement.",
      };
    }

    const orderTime = Date.parse(order.createdAt);
    const elapsed = Date.now() - orderTime;

    if (elapsed > this.CANCELLATION_TIME_LIMIT_MS) {
      return {
        eligible: false,
        reason:
          "Le délai d'annulation de 5 minutes accordé après validation est dépassé.",
      };
    }

    return { eligible: true };
  }

  public static isWithinDeliveryRange(distanceKm: number): boolean {
    return distanceKm <= this.MAXIMUM_DELIVERY_RADIUS_KM;
  }

  public static canApplyCoupon(
    subtotal: number,
    couponSpec: { minPurchaseRequired: number; expiryDate: string },
  ): { valid: boolean; reason?: string } {
    const now = new Date();
    const expiry = new Date(couponSpec.expiryDate);

    if (now > expiry) {
      return { valid: false, reason: "Ce code promotionnel a expiré." };
    }

    if (subtotal < couponSpec.minPurchaseRequired) {
      return {
        valid: false,
        reason: `Ce coupon nécessite un montant d'achat minimum de ${couponSpec.minPurchaseRequired.toLocaleString()} FCFA.`,
      };
    }

    return { valid: true };
  }
}
