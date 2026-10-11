// src/features/messages/payments/components/PaymentStatus.tsx

import { StyleSheet, Text, View } from "react-native";

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

function getStatusSymbol(status: PaymentStatusType): string {
  switch (status) {
    case "succeeded":
      return "✓";

    case "failed":
      return "!";

    case "cancelled":
      return "×";

    case "pending":
    case "processing":
      return "…";

    default:
      return "•";
  }
}

export function PaymentStatus({
  status,
  amount,
  currency = "EUR",
  paymentId,
  error,
}: PaymentStatusProps) {
  if (error) {
    return (
      <View accessibilityRole="alert" style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Paiement impossible</Text>

        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!status) {
    return null;
  }

  const normalizedCurrency = currency.trim().toUpperCase() || "EUR";

  return (
    <View style={styles.container}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.icon,
          status === "succeeded" && styles.iconSuccess,
          status === "failed" && styles.iconFailed,
          status === "cancelled" && styles.iconCancelled,
          (status === "pending" || status === "processing") &&
            styles.iconPending,
        ]}
      >
        <Text style={styles.iconText}>{getStatusSymbol(status)}</Text>
      </View>

      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.statusLabel}>
          {STATUS_LABELS[status]}
        </Text>

        {typeof amount === "number" && Number.isFinite(amount) ? (
          <Text style={styles.amount}>
            {amount.toFixed(2)} {normalizedCurrency}
          </Text>
        ) : null}

        {paymentId ? (
          <Text selectable style={styles.reference}>
            Référence : {paymentId}
          </Text>
        ) : null}
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
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0c1022",
  },

  errorContainer: {
    flexDirection: "column",
    gap: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.25)",
    backgroundColor: "rgba(127,29,29,0.18)",
  },

  errorTitle: {
    fontWeight: "700",
    fontSize: 14,
    color: "#fca5a5",
  },

  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#fecaca",
  },

  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  iconSuccess: {
    backgroundColor: "rgba(34,197,94,0.18)",
  },

  iconFailed: {
    backgroundColor: "rgba(239,68,68,0.18)",
  },

  iconCancelled: {
    backgroundColor: "rgba(148,163,184,0.18)",
  },

  iconPending: {
    backgroundColor: "rgba(59,130,246,0.18)",
  },

  iconText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#ffffff",
  },

  content: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    gap: 3,
  },

  statusLabel: {
    fontWeight: "700",
    fontSize: 14,
    color: "#ffffff",
  },

  amount: {
    fontSize: 13,
    color: "#d1d5db",
  },

  reference: {
    fontSize: 11,
    color: "#6b7280",
  },
});

export default PaymentStatus;
