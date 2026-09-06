// src/features/transport/constants/paymentMethods.ts
import { Wallet, CreditCard, Coins, QrCode } from "lucide-react-native";

export interface PaymentMethod {
  id: "momo" | "card" | "crypto" | "wallet" | "cash";
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  isAvailable: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "momo",
    label: "Mobile Money",
    description: "Orange Money, MTN, Airtel, M-Pesa",
    icon: Wallet,
    isAvailable: true,
  },
  {
    id: "card",
    label: "Carte Bancaire",
    description: "Visa, Mastercard, UnionPay",
    icon: CreditCard,
    isAvailable: true,
  },
  {
    id: "crypto",
    label: "Crypto (USDT)",
    description: "Paiement via Binance Pay, Trust Wallet",
    icon: Coins,
    isAvailable: true,
  },
  {
    id: "wallet",
    label: "Portefeuille Débrouille",
    description: "Utilisez votre solde interne DébrouillePay",
    icon: Wallet,
    isAvailable: true,
  },
  {
    id: "cash",
    label: "Paiement à bord",
    description: "Payez directement le chauffeur en espèces",
    icon: QrCode,
    isAvailable: true,
  },
];
