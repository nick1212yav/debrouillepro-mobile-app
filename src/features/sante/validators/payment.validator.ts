// src/features/sante/validators/payment.validator.ts

import { z } from "zod";
import { auditFieldsSchema } from "./common.validators";

// ─── Enums ────────────────────────────────────────────────

export const paymentMethodEnum = z.enum([
  "card",
  "mobile_money",
  "cash",
  "insurance",
]);

export const paymentStatusEnum = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
]);

// ─── Schémas ──────────────────────────────────────────────

export const paymentSchema = z.object({
  amount: z.number().positive("Le montant doit être > 0"),
  currency: z.string().min(1).default("EUR"),
  method: paymentMethodEnum,
  status: paymentStatusEnum.default("pending"),
  reference: z.string().min(1, "La référence est requise"),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  date: z.string().datetime(),
  ...auditFieldsSchema.shape,
});

export const paymentResultSchema = z.object({
  transactionId: z.string().min(1),
  status: paymentStatusEnum,
  receipt: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1),
  method: z.string().min(1),
  date: z.string().datetime(),
});

// ─── Types inférés ────────────────────────────────────────

export type Payment = z.infer<typeof paymentSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;
export type PaymentResult = z.infer<typeof paymentResultSchema>;
