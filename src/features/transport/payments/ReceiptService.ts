// src/features/transport/payments/ReceiptService.ts
import type { TransportBooking } from "../types";

export interface PrintedReceipt {
  receiptId: string;
  bookingId: string;
  passengerName: string;
  qrCodeToken: string;
  amountFormatted: string;
}

export class ReceiptService {
  /**
   * Produire un reçu d'embarquement DébrouillePro sécurisé [2]
   */
  static generateReceipt(
    booking: TransportBooking,
    passengerName: string,
  ): PrintedReceipt {
    const receiptId = `REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const qrCodeToken = `TOKEN-SECURE-${booking._id}-${booking.userId}`;

    return {
      receiptId,
      bookingId: booking._id,
      passengerName,
      qrCodeToken,
      amountFormatted: `${booking.totalAmount.toLocaleString()} ${booking.currency}`,
    };
  }
}
