export type OrderSourceType = "delivery" | "takeaway" | "table_dine_in";

export interface OrderLogEntry {
  id: string;
  orderSource: OrderSourceType;
  itemsCount: number;
  pricePaid: number;
  preparationTimeMins: number;
  timeOrdered: string; // ISO string format '2026-08-01T20:15:00.000Z'
}

export class OrderAnalytics {
  public static getAverageBasketSize(orders: OrderLogEntry[]): number {
    if (orders.length === 0) return 0;
    const total = orders.reduce((sum, item) => sum + item.pricePaid, 0);
    return Math.round(total / orders.length);
  }

  public static getAveragePreparationTime(orders: OrderLogEntry[]): number {
    if (orders.length === 0) return 0;
    const total = orders.reduce(
      (sum, item) => sum + item.preparationTimeMins,
      0,
    );
    return Number((total / orders.length).toFixed(1));
  }

  public static getOrderSourceDistribution(
    orders: OrderLogEntry[],
  ): Record<OrderSourceType, { count: number; percentage: number }> {
    const distribution: Record<OrderSourceType, number> = {
      delivery: 0,
      takeaway: 0,
      table_dine_in: 0,
    };
    orders.forEach((o) => distribution[o.orderSource]++);

    const total = orders.length;
    const result: any = {};

    (Object.keys(distribution) as OrderSourceType[]).forEach((key) => {
      const count = distribution[key];
      result[key] = {
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      };
    });

    return result;
  }

  public static getHourlyPeakActivity(
    orders: OrderLogEntry[],
  ): { hour: number; count: number }[] {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

    orders.forEach((order) => {
      const date = new Date(order.timeOrdered);
      const hour = date.getHours();
      if (hour >= 0 && hour < 24) {
        const hObj = hours.find((h) => h.hour === hour);
        if (hObj) hObj.count++;
      }
    });

    return hours.sort((a, b) => b.count - a.count);
  }
}
