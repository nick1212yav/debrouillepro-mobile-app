// src/features/agri/types/pricing.types.ts
import type { AgriUnit } from "./product.types";

export interface AgriPricingConfig {
  price: number;
  currency: string; // Ex : 'USD' | 'CDF' | 'CFA'
  priceUnit: AgriUnit;
  negotiable: boolean;
}
