import {
  View,
  Text,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from "react-native";

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
    <View style={[containerStyle, isOwn ? alignEndStyle : alignStartStyle]}>
      <View style={headerStyle}>
        <View style={iconContainerStyle}>
          <Text style={iconTextStyle}>€</Text>
        </View>
        <View style={headerTextContainerStyle}>
          <Text style={paymentTitleStyle}>Paiement</Text>
          <Text style={statusStyle}>{STATUS_LABELS[payment.status]}</Text>
        </View>
      </View>

      <Text style={amountStyle}>
        {payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
      </Text>

      {payment.description && (
        <Text style={descriptionStyle}>{payment.description}</Text>
      )}

      {canConfirm && (
        <Pressable
          disabled={isLoading}
          onPress={() => onConfirm?.(payment.paymentIntentId!)}
          style={confirmButtonStyle}
        >
          <Text style={confirmButtonTextStyle}>
            {isLoading ? "Confirmation…" : "Confirmer le paiement"}
          </Text>
        </Pressable>
      )}

      {payment.id && <Text style={referenceStyle}>Réf. {payment.id}</Text>}
    </View>
  );
}

const containerStyle: ViewStyle = {
  width: "100%",
  maxWidth: 320,
  padding: 16,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  backgroundColor: "#fff",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

const alignEndStyle: ViewStyle = { alignSelf: "flex-end" };
const alignStartStyle: ViewStyle = { alignSelf: "flex-start" };

const headerStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
};

const iconContainerStyle: ViewStyle = {
  width: 38,
  height: 38,
  borderRadius: 12,
  backgroundColor: "#111827",
  alignItems: "center",
  justifyContent: "center",
};

const iconTextStyle: TextStyle = {
  color: "#fff",
  fontSize: 18,
  fontWeight: "700",
};

const headerTextContainerStyle: ViewStyle = {
  flex: 1,
};

const paymentTitleStyle: TextStyle = {
  fontSize: 14,
  fontWeight: "700",
  color: "#111827",
};

const statusStyle: TextStyle = {
  marginTop: 2,
  fontSize: 12,
  color: "#6b7280",
};

const amountStyle: TextStyle = {
  marginTop: 16,
  fontSize: 24,
  fontWeight: "800",
  color: "#111827",
};

const descriptionStyle: TextStyle = {
  marginTop: 8,
  fontSize: 13,
  color: "#4b5563",
};

const confirmButtonStyle: ViewStyle = {
  width: "100%",
  marginTop: 14,
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 10,
  backgroundColor: "#111827",
  alignItems: "center",
};

const confirmButtonTextStyle: TextStyle = {
  color: "#fff",
  fontWeight: "600",
  fontSize: 14,
};

const referenceStyle: TextStyle = {
  marginTop: 10,
  fontSize: 11,
  color: "#9ca3af",
};

export default PaymentMessage;