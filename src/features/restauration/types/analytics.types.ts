import { BCGMatrixClass, CustomerSegment } from "./enums";
import type { PeriodComparison } from "./common.types";

export interface RestaurantGeneralKPIs {
  views: number;
  totalOrders: number;
  totalBookings: number;
  cancelledBookings: number;
  activePromotionsCount: number;
  averageRating: number;
}

export interface BCGItemResult {
  name: string;
  margin: number;
  classification: BCGMatrixClass;
  actionRequired: string;
}

export interface CustomerHistoryRecord {
  customerId: string;
  joinedAt: string;
  latestPurchaseAt: string;
  totalOrdersCount: number;
  totalSpentValue: number;
  segment?: CustomerSegment;
}
