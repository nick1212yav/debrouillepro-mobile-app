// src/features/messages/payments/components/PaymentMessage.tsx

import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const paymentIntentId = payment.paymentIntentId;

  const canConfirm =
    payment.status === "pending" &&
    typeof paymentIntentId === "string" &&
    paymentIntentId.length > 0 &&
    onConfirm !== undefined;

  const currency = payment.currency.trim().toUpperCase() || "EUR";

  const statusLabel = STATUS_LABELS[payment.status] ?? "Statut inconnu";

  const handleConfirm = () => {
    if (!canConfirm || !paymentIntentId || isLoading) {
      return;
    }

    onConfirm?.(paymentIntentId);
  };

  return (
    <View
      style={[styles.container, isOwn ? styles.alignEnd : styles.alignStart]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>€</Text>
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.paymentTitle}>Paiement</Text>

          <Text style={styles.status}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.amount}>
        {payment.amount.toFixed(2)} {currency}
      </Text>

      {payment.description ? (
        <Text style={styles.description}>{payment.description}</Text>
      ) : null}

      {canConfirm ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Confirmer le paiement"
          accessibilityState={{
            disabled: isLoading,
            busy: isLoading,
          }}
          disabled={isLoading}
          onPress={handleConfirm}
          style={({ pressed }) => [
            styles.confirmButton,
            isLoading && styles.confirmButtonDisabled,
            pressed && !isLoading && styles.confirmButtonPressed,
          ]}
        >
          <Text style={styles.confirmButtonText}>
            {isLoading ? "Confirmation…" : "Confirmer le paiement"}
          </Text>
        </Pressable>
      ) : null}

      {payment.id ? (
        <Text selectable style={styles.reference}>
          Réf. {payment.id}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 320,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0c1022",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },

  alignEnd: {
    alignSelf: "flex-end",
  },

  alignStart: {
    alignSelf: "flex-start",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(37,99,235,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    color: "#93c5fd",
    fontSize: 18,
    fontWeight: "700",
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  paymentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  status: {
    marginTop: 2,
    fontSize: 12,
    color: "#9ca3af",
  },

  amount: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },

  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#d1d5db",
  },

  confirmButton: {
    width: "100%",
    marginTop: 14,
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmButtonDisabled: {
    opacity: 0.5,
  },

  confirmButtonPressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },

  reference: {
    marginTop: 10,
    fontSize: 11,
    color: "#6b7280",
  },
});

export default PaymentMessage;
