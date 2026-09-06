export interface DeliveryPerformanceTicket {
  orderId: string;
  deliveryId: string;
  pickupTime: string;
  deliveredTime: string;
  targetMins: number;
  deliveryDistanceKm: number;
}

export class DeliveryAnalytics {
  public static computeOnTimeDeliveryRate(
    tickets: DeliveryPerformanceTicket[],
  ): { rate: number; delayedCount: number } {
    if (tickets.length === 0) return { rate: 0, delayedCount: 0 };

    let delayedCount = 0;

    tickets.forEach((ticket) => {
      const start = Date.parse(ticket.pickupTime);
      const end = Date.parse(ticket.deliveredTime);
      const elapsedMins = (end - start) / 60000;

      if (elapsedMins > ticket.targetMins) {
        delayedCount++;
      }
    });

    const onTimeCount = tickets.length - delayedCount;
    const rate = Number(((onTimeCount / tickets.length) * 100).toFixed(2));

    return { rate, delayedCount };
  }

  public static getAverageDeliverySpeedKmh(
    tickets: DeliveryPerformanceTicket[],
  ): number {
    let totalKm = 0;
    let totalHours = 0;

    tickets.forEach((t) => {
      const start = Date.parse(t.pickupTime);
      const end = Date.parse(t.deliveredTime);
      const hoursElapsed = (end - start) / 3600000;

      if (hoursElapsed > 0) {
        totalKm += t.deliveryDistanceKm;
        totalHours += hoursElapsed;
      }
    });

    if (totalHours === 0) return 0;
    return Number((totalKm / totalHours).toFixed(1));
  }
}
