export interface CustomerHistoryRecord {
  customerId: string;
  joinedAt: string;
  latestPurchaseAt: string;
  totalOrdersCount: number;
  totalSpentValue: number;
}

export type CustomerSegment =
  | "VIP"
  | "Loyal"
  | "Occasional"
  | "At Risk"
  | "Inactive";

export class CustomerAnalytics {
  public static calculateChurnRate(
    activeLastMonth: number,
    lostThisMonth: number,
  ): number {
    if (activeLastMonth <= 0) return 0;
    return Number(((lostThisMonth / activeLastMonth) * 100).toFixed(2));
  }

  public static segmentCustomer(
    customer: CustomerHistoryRecord,
    comparisonTimestamp: number,
  ): CustomerSegment {
    const lastSeenDate = Date.parse(customer.latestPurchaseAt);
    const msInDay = 86400000;
    const daysSinceLastPurchase =
      (comparisonTimestamp - lastSeenDate) / msInDay;

    if (daysSinceLastPurchase > 90) return "Inactive";
    if (daysSinceLastPurchase > 30) return "At Risk";

    if (customer.totalOrdersCount >= 10 && customer.totalSpentValue >= 100000)
      return "VIP";
    if (customer.totalOrdersCount >= 4) return "Loyal";

    return "Occasional";
  }

  public static calculateCustomerLifetimeValue(
    customers: CustomerHistoryRecord[],
  ): number {
    if (customers.length === 0) return 0;
    const totalRevenue = customers.reduce(
      (acc, c) => acc + c.totalSpentValue,
      0,
    );
    return Math.round(totalRevenue / customers.length);
  }
}
