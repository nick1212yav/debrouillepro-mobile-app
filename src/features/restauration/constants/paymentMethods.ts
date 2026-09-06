export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: "mobile_money" | "card" | "crypto" | "cash";
  feePercent: number;
  minAmount: number;
  maxAmount: number;
  currency: string;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "orange_money",
    name: "Orange Money",
    type: "mobile_money",
    feePercent: 1.0, // 1% de frais de transaction
    minAmount: 500,
    maxAmount: 2000000,
    currency: "XOF",
  },
  {
    id: "wave",
    name: "Wave",
    type: "mobile_money",
    feePercent: 1.0,
    minAmount: 100,
    maxAmount: 2000000,
    currency: "XOF",
  },
  {
    id: "mtn",
    name: "MTN Mobile Money",
    type: "mobile_money",
    feePercent: 1.0,
    minAmount: 500,
    maxAmount: 1500000,
    currency: "XOF",
  },
  {
    id: "moov",
    name: "Moov Money",
    type: "mobile_money",
    feePercent: 1.0,
    minAmount: 500,
    maxAmount: 1500000,
    currency: "XOF",
  },
  {
    id: "card",
    name: "Carte Bancaire (Visa / Mastercard)",
    type: "card",
    feePercent: 2.5, // 2.5% de frais de passerelle bancaire internationale
    minAmount: 1000,
    maxAmount: 5000000,
    currency: "XOF",
  },
  {
    id: "crypto",
    name: "USDT / Stablecoin Blockchain",
    type: "crypto",
    feePercent: 0.5,
    minAmount: 2000,
    maxAmount: 10000000,
    currency: "USDT",
  },
  {
    id: "cash",
    name: "Espèces à la livraison",
    type: "cash",
    feePercent: 0.0,
    minAmount: 500,
    maxAmount: 100000, // Sécurité : Plafond bas pour limiter l'exposition liquide des livreurs
    currency: "XOF",
  },
];
