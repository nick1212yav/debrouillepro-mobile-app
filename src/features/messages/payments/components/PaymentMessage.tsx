import { View, Text, ViewStyle, TextStyle, ImageStyle } from "react-native";
// src/features/messages/payments/components/PaymentMessage.tsx

import React from "react";

import type {
  PaymentData,
  PaymentStatus as PaymentState,
} from "../services/payments.service";

export interface PaymentMessageProps {
  payment: PaymentData;

  isOwn?: boolean;

  onConfirm?: (paymentIntentId: string) => void;

  isLoading?: boolean;
}

const STATUS_LABELS: Record<PaymentState, string> = {
  pending: "En attente",
  processing: "Traitement…",
  succeeded: "Payé",
  failed: "Échec",
  cancelled: "Annulé",
};

export function PaymentMessage({
  payment,
  isOwn = false,
  onConfirm,
  isLoading = false,
}: PaymentMessageProps) {
  const canConfirm =
    payment.status === "pending" && !!payment.paymentIntentId && !!onConfirm;

  return (
    <View
      style={{
        ...containerStyle,
        alignSelf: isOwn ? "flex-end" : "flex-start",
      }}
    >
      <View style={headerStyle}>
        <Text style={iconStyle}>€</Text>

        <View>
          <strong><Text>Paiement</Text></strong>

          <View style={statusStyle}>{STATUS_LABELS[payment.status]}</View>
        </View>
      </View>

      <View style={amountStyle}>
        {payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
      </View>

      {payment.description && (
        <Text style={descriptionStyle}>{payment.description}</Text>
      )}

      {canConfirm && (
        <Pressable
          type="button"
          disabled={isLoading}
          onPress={() => onConfirm?.(payment.paymentIntentId!)}
          style={confirmButtonStyle}
        >
          {isLoading ? "Confirmation…" : "Confirmer le paiement"}
        </Pressable>
      )}

      {payment.id && <small style={referenceStyle}><Text>Réf.</Text>{payment.id}</small>}
    </View>
  );
}

const containerStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "min(320px, 100%)",
  padding: 16,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const headerStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const iconStyle: ViewStyle | TextStyle | ImageStyle = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#111827",
  color: "#fff",
  fontWeight: 700,
};

const statusStyle: ViewStyle | TextStyle | ImageStyle = {
  marginTop: 2,
  fontSize: 12,
  opacity: 0.6,
};

const amountStyle: ViewStyle | TextStyle | ImageStyle = {
  marginTop: 16,
  fontSize: 24,
  fontWeight: 800,
};

const descriptionStyle: ViewStyle | TextStyle | ImageStyle = {
  margin: "8px 0 0",
  opacity: 0.75,
};

const confirmButtonStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  marginTop: 14,
  padding: "10px 12px",
  border: "none",
  borderRadius: 10,
  background: "#111827",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const referenceStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "block",
  marginTop: 10,
  opacity: 0.45,
};

export default PaymentMessage;
