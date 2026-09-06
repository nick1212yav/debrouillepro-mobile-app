export class CancellationPolicy {
  static getRefundAmount(params: {
    bookingAmount: number;
    checkInDate: string;
    cancelledAt: number;
  }): { refundAmount: number; penaltyAmount: number; percentage: number } {
    const checkIn = new Date(params.checkInDate);
    const cancel = new Date(params.cancelledAt);

    // Différence en heures
    const diffTime = checkIn.getTime() - cancel.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    if (diffHours >= 48) {
      // Annulation gratuite jusqu'à 48h avant l'arrivée
      return {
        refundAmount: params.bookingAmount,
        penaltyAmount: 0,
        percentage: 100,
      };
    } else if (diffHours >= 24) {
      // Remboursement à 50% entre 24h et 48h avant l'arrivée
      const refund = Math.round(params.bookingAmount * 0.5);
      return {
        refundAmount: refund,
        penaltyAmount: params.bookingAmount - refund,
        percentage: 50,
      };
    } else {
      // Aucun remboursement dans les 24h précédant l'arrivée
      return {
        refundAmount: 0,
        penaltyAmount: params.bookingAmount,
        percentage: 0,
      };
    }
  }
}
