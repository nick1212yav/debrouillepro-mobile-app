// src/features/sante/types/payment.types.ts

import type { AuditFields } from "./common.types";

export type PaymentMethod = "card" | "mobile_money" | "cash" | "insurance";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Payment extends AuditFields {
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  date: string;
}

export interface PaymentResult {
  transactionId: string;
  status: PaymentStatus;
  receipt: string;
  amount: number;
  currency: string;
  method: string;
  date: string;
}
