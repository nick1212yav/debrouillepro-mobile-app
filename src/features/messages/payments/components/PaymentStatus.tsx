import { View, Text, StyleSheet } from "react-native";

// src/features/messages/payments/components/PaymentStatus.tsx

import type { PaymentStatus as PaymentStatusType } from "../services/payments.service";

export interface PaymentStatusProps {
  status: PaymentStatusType | null;
  amount?: number;
  currency?: string;
  paymentId?: string;
  error?: string | null;
}

const STATUS_LABELS: Record<PaymentStatusType, string> = {
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
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Paiement impossible</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!status) {
    return null;
  }

  const symbol =
    status === "succeeded"
      ? "✓"
      : status === "failed"
        ? "!"
        : status === "cancelled"
          ? "×"
          : "…";

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{symbol}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.statusLabel}>{STATUS_LABELS[status]}</Text>
        {typeof amount === "number" && (
          <Text style={styles.amount}>
            {amount.toFixed(2)} {currency.toUpperCase()}
          </Text>
        )}
        {paymentId && (
          <Text style={styles.reference}>Référence : {paymentId}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },
  errorContainer: {
    flexDirection: "column",
    gap: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  errorTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: "#991b1b",
  },
  errorText: {
    fontSize: 13,
    color: "#991b1b",
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#ffffff",
  },
  content: {
    flex: 1,
    flexDirection: "column",
    gap: 3,
  },
  statusLabel: {
    fontWeight: "700",
    fontSize: 14,
    color: "#111827",
  },
  amount: {
    fontSize: 13,
    color: "#4b5563",
  },
  reference: {
    fontSize: 11,
    color: "#6b7280",
  },
});

export default PaymentStatus;