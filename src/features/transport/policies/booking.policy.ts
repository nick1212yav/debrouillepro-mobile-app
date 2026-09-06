// src/features/transport/policies/booking.policy.ts
import type { TransportRoute } from "../types";

export interface CancellationPenalty {
  penaltyAmount: number;
  refundAmount: number;
  currency: string;
  canCancelFree: boolean;
}

export class BookingPolicy {
  // Déterminer si un chauffeur remplit les critères d'excellence pour rouler
  static isDriverEligible(rating: number, verified: boolean): boolean {
    const MINIMUM_RATING = 4.0;
    return verified && rating >= MINIMUM_RATING;
  }

  // Évaluer l'éligibilité et calculer les pénalités d'annulation [2]
  static calculateCancellationPenalty(
    totalAmount: number,
    currency: string,
    departureTime: string, // format "HH:MM"
    currentTime: string, // format "HH:MM"
  ): CancellationPenalty {
    // Différence d'heures simplifiée
    const [depHour, depMin] = departureTime.split(":").map(Number);
    const [curHour, curMin] = currentTime.split(":").map(Number);

    const depMinutes = depHour * 60 + depMin;
    const curMinutes = curHour * 60 + curMin;
    const minutesRemaining = depMinutes - curMinutes;

    // Annulation gratuite si effectuée plus de 60 minutes avant le départ [2]
    if (minutesRemaining >= 60 || minutesRemaining < 0) {
      return {
        penaltyAmount: 0,
        refundAmount: totalAmount,
        currency,
        canCancelFree: true,
      };
    }

    // Pénalité de 30% si effectuée à moins d'une heure du départ [2]
    const penaltyRate = 0.3;
    const penaltyAmount = parseFloat((totalAmount * penaltyRate).toFixed(2));
    const refundAmount = parseFloat((totalAmount - penaltyAmount).toFixed(2));

    return {
      penaltyAmount,
      refundAmount,
      currency,
      canCancelFree: false,
    };
  }
}
