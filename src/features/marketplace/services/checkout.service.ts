// src/features/marketplace/services/checkout.service.ts
import type { CartItem, Order } from "../types";

export interface CheckoutResult {
  order: Order;
  paymentUrl?: string;
}

export class CheckoutService {
  /**
   * Calcule le total du panier
   */
  calculateTotal(items: CartItem[]): number {
    return items.reduce(
      (sum, item) => sum + (item.product?.price || 0) * item.quantity,
      0,
    );
  }

  /**
   * Calcule les frais de livraison
   */
  calculateShipping(items: CartItem[], address: string): number {
    // Simulation du calcul des frais de livraison
    const total = this.calculateTotal(items);
    if (total > 50000) return 0;
    return 2000;
  }

  /**
   * Calcule les taxes
   */
  calculateTax(total: number): number {
    return total * 0.18; // 18% TVA
  }

  /**
   * Valide l'adresse de livraison
   */
  validateAddress(address: string): boolean {
    return address.trim().length > 5;
  }

  /**
   * Vérifie la disponibilité des produits
   */
  checkAvailability(items: CartItem[]): Promise<boolean> {
    return Promise.resolve(
      items.every((item) => item.quantity <= (item.product?.stock || 0)),
    );
  }

  /**
   * Crée une commande
   */
  async createOrder(
    items: CartItem[],
    address: string,
    note?: string,
  ): Promise<CheckoutResult> {
    const total = this.calculateTotal(items);
    const shipping = this.calculateShipping(items, address);
    const tax = this.calculateTax(total);

    // Simulation de création de commande
    const order: Order = {
      _id: `ORD_${Date.now()}` as any,
      buyerId: "user" as any,
      sellerId: items[0]?.product?.sellerId || ("seller" as any),
      productId: items[0]?.productId || ("product" as any),
      quantity: items.reduce((s, i) => s + i.quantity, 0),
      totalAmount: total + shipping + tax,
      currency: "FCFA",
      status: "pending",
      deliveryAddress: address,
      note,
      createdAt: Date.now(),
    };

    return { order };
  }
}

export const checkoutService = new CheckoutService();
