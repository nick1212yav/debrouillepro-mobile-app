export type PaymentMethodType = "momo" | "card" | "wallet";

export interface PaymentDetails {
  transactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType | string;
  status: "pending" | "success" | "failed" | "refunded";
  timestamp: number;
  phone?: string;
}
