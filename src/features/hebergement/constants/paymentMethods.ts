export interface PaymentMethodConstant {
  id: "momo" | "card" | "wallet" | string;
  label: string;
  provider?: string;
  logo?: string;
}

export const PAYMENT_METHODS: PaymentMethodConstant[] = [
  { id: "momo", label: "Mobile Money", provider: "Wave, MTN, Orange, Moov" },
  { id: "card", label: "Carte Bancaire", provider: "Visa, Mastercard" },
  {
    id: "wallet",
    label: "Portefeuille DébrouillePro",
    provider: "DébrouillePay",
  },
];
