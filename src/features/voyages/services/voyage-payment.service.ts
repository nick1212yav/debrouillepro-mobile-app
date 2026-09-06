import { UIService } from "@/core/sdk/ui/UIService";

// src/features/voyages/services/voyage-payment.service.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface PaymentData {
  bookingId: string;
  amount: number;
  currency: string;
  method: "mobile_money" | "card" | "wallet";
  phone?: string;
  cardToken?: string;
}

/**
 * Service pour les paiements de voyages.
 * Pour l'instant, un service de base. Plus tard, on connectera à DébrouillePay.
 */
export class VoyagePaymentService {
  /**
   * Initialise un paiement
   */
  static async initiatePayment(
    data: PaymentData,
    initFn: any,
  ): Promise<string | null> {
    try {
      const result = await initFn(data);
      UIService.openToast("Paiement initié", "success");
      return result.paymentId;
    } catch {
      UIService.openToast("Erreur lors de l'initiation du paiement", "error");
      return null;
    }
  }

  /**
   * Confirme un paiement
   */
  static async confirmPayment(
    paymentId: string,
    confirmFn: any,
  ): Promise<boolean> {
    try {
      await confirmFn({ paymentId });
      UIService.openToast("Paiement confirmé", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la confirmation du paiement", "error");
      return false;
    }
  }

  /**
   * Rembourse un paiement
   */
  static async refundPayment(
    bookingId: string,
    refundFn: any,
  ): Promise<boolean> {
    try {
      await refundFn({ bookingId });
      UIService.openToast("Remboursement effectué", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors du remboursement", "error");
      return false;
    }
  }

  /**
   * Calcule le prix total d'une réservation
   */
  static calculateTotal(
    pricePerSeat: number,
    seats: number,
    fees: number = 0,
  ): number {
    return pricePerSeat * seats + fees;
  }

  /**
   * Formate le prix en fonction de la devise
   */
  static formatPrice(amount: number, currency: string = "FCFA"): string {
    return `${amount.toLocaleString()} ${currency}`;
  }

  /**
   * Vérifie si un paiement est éligible au remboursement
   * (ex: annulation dans les délais)
   */
  static isEligibleForRefund(bookingDate: Date, departureDate: Date): boolean {
    const now = new Date();
    const hoursBeforeDeparture =
      (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Remboursement possible si plus de 24h avant le départ
    return hoursBeforeDeparture > 24;
  }
}
