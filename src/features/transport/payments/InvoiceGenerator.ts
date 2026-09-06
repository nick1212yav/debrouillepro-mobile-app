// src/features/transport/payments/InvoiceGenerator.ts

export interface GeneratedInvoice {
  invoiceNumber: string;
  grossAmount: number;
  netAmount: number;
  taxAmount: number;
  taxRatePercent: number;
  currency: string;
  issuedAt: string;
  metadata: {
    origin: string;
    destination: string;
    seatsBooked: number;
  };
}

export class InvoiceGenerator {
  private static REGIONAL_TAX_RATE = 0.16; // 16% de TVA standard (ex: RDC, Côte d'Ivoire) [2]

  /**
   * Générer de façon robuste une facture de mobilité panafricaine [2]
   */
  static generateInvoice(
    seatsBooked: number,
    pricePerSeat: number,
    currency: string,
    origin: string,
    destination: string,
  ): GeneratedInvoice {
    const grossAmount = seatsBooked * pricePerSeat;

    // Calcul de la taxe régionale incluse dans le montant brut (TVA) [2]
    const taxAmount = parseFloat(
      (
        (grossAmount * this.REGIONAL_TAX_RATE) /
        (1 + this.REGIONAL_TAX_RATE)
      ).toFixed(2),
    );
    const netAmount = parseFloat((grossAmount - taxAmount).toFixed(2));

    const invoiceNumber = `INV-MOBI-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      invoiceNumber,
      grossAmount,
      netAmount,
      taxAmount,
      taxRatePercent: this.REGIONAL_TAX_RATE * 100,
      currency,
      issuedAt: new Date().toISOString(),
      metadata: {
        origin,
        destination,
        seatsBooked,
      },
    };
  }
}
