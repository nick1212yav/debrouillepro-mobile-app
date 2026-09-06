import { View, Text, ViewStyle, TextStyle, ImageStyle } from "react-native";
// src/features/messages/payments/components/PaymentStatus.tsx

import React from "react";

import type { PaymentStatus } from "../services/payments.service";

export interface PaymentStatusProps {
  status: PaymentStatus | null;

  amount?: number;
  currency?: string;

  paymentId?: string;

  error?: string | null;
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Paiement en attente",
  processing: "Paiement en cours",
  succeeded: "Paiement réussi",
  failed: "Paiement échoué",
  cancelled: "Paiement annulé",
};

export function PaymentStatus({
  status,
  amount,
  currency = "EUR",
  paymentId,
  error,
}: PaymentStatusProps) {
  if (error) {
    return (
      <View style={errorContainerStyle}>
        <strong><Text>Paiement impossible</Text></strong>

        <Text>{error}</Text>
      </View>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <View style={containerStyle} data-status={status}>
      <View style={iconStyle}>
        {status === "succeeded"
          ? "✓"
          : status === "failed"
            ? "!"
            : status === "cancelled"
              ? "×"
              : "…"}
      </View>

      <View style={contentStyle}>
        <strong>{STATUS_LABELS[status]}</strong>

        {typeof amount === "number" && (
          <Text>
            {amount.toFixed(2)} {currency.toUpperCase()}
          </Text>
        )}

        {paymentId && <small><Text>Référence :</Text>{paymentId}</small>}
      </View>
    </View>
  );
}

const containerStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 14,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const errorContainerStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  padding: 14,
  borderRadius: 14,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#991b1b",
};

const iconStyle: ViewStyle | TextStyle | ImageStyle = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  background: "#111827",
  color: "#fff",
};

const contentStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

export default PaymentStatus;
