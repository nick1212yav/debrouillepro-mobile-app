export interface RestaurantGeneralKPIs {
  views: number;
  totalOrders: number;
  totalBookings: number;
  cancelledBookings: number;
  activePromotionsCount: number;
  averageRating: number;
}

export interface PeriodComparison {
  currentValue: number;
  previousValue: number;
  percentageDiff: number;
  trend: "up" | "down" | "stable";
}

export class RestaurantAnalytics {
  public static calculateConversionRate(
    views: number,
    totalOrders: number,
  ): number {
    if (views <= 0) return 0;
    return Number(((totalOrders / views) * 100).toFixed(2));
  }

  public static calculateBookingFulfillmentRate(
    total: number,
    cancelled: number,
  ): number {
    if (total <= 0) return 0;
    const fulfilled = total - cancelled;
    return Number(((fulfilled / total) * 100).toFixed(2));
  }

  public static comparePeriods(
    current: number,
    previous: number,
  ): PeriodComparison {
    if (previous === 0) {
      return {
        currentValue: current,
        previousValue: previous,
        percentageDiff: current > 0 ? 100 : 0,
        trend: current > 0 ? "up" : "stable",
      };
    }

    const diff = ((current - previous) / previous) * 100;
    let trend: "up" | "down" | "stable" = "stable";
    if (diff > 0.5) trend = "up";
    if (diff < -0.5) trend = "down";

    return {
      currentValue: current,
      previousValue: previous,
      percentageDiff: Number(Math.abs(diff).toFixed(2)),
      trend,
    };
  }

  public static evaluateHealthScore(kpis: RestaurantGeneralKPIs): {
    score: number;
    label: string;
    color: string;
  } {
    let score = 0;

    const conv = this.calculateConversionRate(kpis.views, kpis.totalOrders);
    if (conv >= 15) score += 30;
    else if (conv >= 8) score += 15;

    if (kpis.averageRating >= 4.5) score += 30;
    else if (kpis.averageRating >= 4.0) score += 20;

    const bookingRatio = this.calculateBookingFulfillmentRate(
      kpis.totalBookings,
      kpis.cancelledBookings,
    );
    if (bookingRatio >= 85) score += 20;

    if (kpis.totalOrders > 50) score += 20;

    let label = "Standard";
    let color = "#EAB308"; // Amber
    if (score >= 75) {
      label = "Excellent";
      color = "#10B981";
    } else if (score < 40) {
      label = "Critique";
      color = "#EF4444";
    }

    return { score, label, color };
  }
}
