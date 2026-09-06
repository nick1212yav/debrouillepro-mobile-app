// src/features/marketplace/constants/payment.ts

export const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", icon: "💳", enabled: true },
  { id: "mobile_money", label: "Mobile Money", icon: "📱", enabled: true },
  { id: "crypto", label: "Cryptomonnaie", icon: "₿", enabled: false },
  {
    id: "cash_on_delivery",
    label: "Paiement à la livraison",
    icon: "💵",
    enabled: true,
  },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export const MOBILE_MONEY_PROVIDERS = [
  { id: "orange_money", label: "Orange Money", color: "#FF7900" },
  { id: "mtn_money", label: "MTN Mobile Money", color: "#FFCC00" },
  { id: "airtel_money", label: "Airtel Money", color: "#ED1C24" },
  { id: "moov_money", label: "Moov Money", color: "#00A651" },
] as const;

export const CRYPTO_CURRENCIES = [
  { id: "BTC", label: "Bitcoin", icon: "₿" },
  { id: "ETH", label: "Ethereum", icon: "⟠" },
  { id: "USDT", label: "Tether", icon: "₮" },
] as const;
