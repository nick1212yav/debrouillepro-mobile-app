export type PaymentGateway =
  | "orange_money"
  | "wave"
  | "moov"
  | "mtn"
  | "cash"
  | "card"
  | "crypto";

export interface TransactionRecord {
  id: string;
  grossAmount: number;
  taxAmount: number;
  systemFee: number;
  paymentGateway: PaymentGateway;
  createdAt: string;
}

export class RevenueAnalytics {
  public static calculateNetRevenue(transactions: TransactionRecord[]): {
    gross: number;
    net: number;
    fees: number;
    taxes: number;
  } {
    let gross = 0;
    let taxes = 0;
    let fees = 0;

    transactions.forEach((t) => {
      gross += t.grossAmount;
      taxes += t.taxAmount;
      fees += t.systemFee;
    });

    return {
      gross,
      net: gross - taxes - fees,
      fees,
      taxes,
    };
  }

  public static getShareByGateway(
    transactions: TransactionRecord[],
  ): Record<PaymentGateway, { grossAmount: number; sharePercent: number }> {
    const aggregate: Record<PaymentGateway, number> = {
      orange_money: 0,
      wave: 0,
      moov: 0,
      mtn: 0,
      cash: 0,
      card: 0,
      crypto: 0,
    };
    let totalGross = 0;

    transactions.forEach((t) => {
      aggregate[t.paymentGateway] += t.grossAmount;
      totalGross += t.grossAmount;
    });

    const result: any = {};
    (Object.keys(aggregate) as PaymentGateway[]).forEach((gw) => {
      const gross = aggregate[gw];
      result[gw] = {
        grossAmount: gross,
        sharePercent:
          totalGross > 0 ? Number(((gross / totalGross) * 100).toFixed(1)) : 0,
      };
    });

    return result;
  }

  public static forecastNextMonthRevenue(
    pastThreeMonthsRevenue: [number, number, number],
  ): { estimatedValue: number; confidence: "high" | "medium" | "low" } {
    const [m1, m2, m3] = pastThreeMonthsRevenue;
    const growth1 = m1 > 0 ? (m2 - m1) / m1 : 0;
    const growth2 = m2 > 0 ? (m3 - m2) / m2 : 0;

    const avgGrowth = (growth1 + growth2) / 2;
    const estimatedValue = Math.round(m3 * (1 + avgGrowth));

    let confidence: "high" | "medium" | "low" = "medium";
    const divergence = Math.abs(growth1 - growth2);
    if (divergence < 0.05) confidence = "high";
    else if (divergence > 0.2) confidence = "low";

    return { estimatedValue, confidence };
  }
}
