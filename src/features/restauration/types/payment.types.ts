import { PaymentGateway } from "./enums";

export interface TransactionRecord {
  id: string;
  orderId: string;
  grossAmount: number;
  taxAmount: number;
  systemFee: number;
  paymentGateway: PaymentGateway;
  createdAt: string;
}

export interface PaymentSplitPayload {
  totalAmount: number;
  restaurantShare: number;
  platformShare: number;
  restaurantWalletId: string;
  platformWalletId: string;
}
