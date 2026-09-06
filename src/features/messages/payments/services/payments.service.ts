// src/features/messages/payments/services/payments.service.ts

export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentIntentResult {
  id: string;
  clientSecret: string;
}

export interface ProcessPaymentInput {
  amount: number;
  currency: string;
  source: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessPaymentResult {
  id: string;
  status: string;
}

export interface ConfirmPaymentInput {
  paymentIntentId: string;
}

export interface ConfirmPaymentResult {
  id: string;
  status: string;
}

export interface PaymentData {
  id?: string;
  paymentIntentId?: string;

  amount: number;
  currency: string;

  description?: string;

  status: PaymentStatus;

  senderId?: string;
  recipientId?: string;
  conversationId?: string;

  createdAt?: number;
  completedAt?: string;

  metadata?: Record<string, unknown>;
}
