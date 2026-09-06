// src/features/marketplace/ai/NegotiationAI.ts

export interface Offer {
  price: number;
  currency: string;
  quantity: number;
  message: string;
}

export interface NegotiationResult {
  accepted: boolean;
  counterOffer?: Offer;
  message: string;
}

export class NegotiationAI {
  /**
   * Analyse une offre et propose une contre-offre
   */
  async negotiate(
    initialPrice: number,
    userOffer: number,
    currency: string,
    quantity: number,
  ): Promise<NegotiationResult> {
    const diff = initialPrice - userOffer;
    const percentDiff = (diff / initialPrice) * 100;

    if (percentDiff <= 5) {
      return {
        accepted: true,
        message: "Offre acceptée !",
      };
    }

    if (percentDiff <= 15) {
      return {
        accepted: false,
        counterOffer: {
          price: initialPrice * 0.9,
          currency,
          quantity,
          message: "Nous pouvons faire 10% de réduction",
        },
        message: "Contre-offre proposée",
      };
    }

    return {
      accepted: false,
      counterOffer: {
        price: initialPrice * 0.85,
        currency,
        quantity,
        message: "Meilleur prix: 15% de réduction",
      },
      message: "Prix final proposé",
    };
  }

  /**
   * Estime la marge de négociation possible
   */
  estimateNegotiationRange(price: number): { min: number; max: number } {
    return {
      min: price * 0.7,
      max: price * 0.95,
    };
  }
}

export const negotiationAI = new NegotiationAI();
