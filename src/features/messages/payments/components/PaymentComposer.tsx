// src/features/messages/payments/components/PaymentComposer.tsx

import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useState } from "react";

export interface PaymentComposerProps {
  currency?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onSubmit: (amount: number, currency: string, description?: string) => void;
}

export function PaymentComposer({
  currency = "EUR",
  disabled = false,
  isLoading = false,
  onSubmit,
}: PaymentComposerProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const isDisabled = disabled || isLoading;

  const normalizedCurrency = currency.trim().toUpperCase() || "EUR";

  const handleSubmit = () => {
    if (isDisabled) {
      return;
    }

    const parsedAmount = Number.parseFloat(amount.replace(",", "."));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onSubmit(parsedAmount, normalizedCurrency, description.trim() || undefined);
  };

  const canSubmit = !isDisabled && amount.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Envoyer un paiement</Text>
      </View>

      <View style={styles.amountRow}>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor="#6b7280"
          style={[styles.amountInput, isDisabled && styles.inputDisabled]}
          accessibilityLabel="Montant"
          accessibilityHint="Saisissez le montant du paiement"
          keyboardType="decimal-pad"
          editable={!isDisabled}
          returnKeyType="next"
        />

        <Text style={styles.currency}>{normalizedCurrency}</Text>
      </View>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Motif du paiement"
        placeholderTextColor="#6b7280"
        maxLength={200}
        style={[styles.descriptionInput, isDisabled && styles.inputDisabled]}
        accessibilityLabel="Motif du paiement"
        editable={!isDisabled}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isLoading ? "Traitement du paiement" : "Continuer le paiement"
        }
        accessibilityState={{
          disabled: !canSubmit,
          busy: isLoading,
        }}
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.button,
          !canSubmit && styles.buttonDisabled,
          pressed && canSubmit && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Traitement..." : "Continuer"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0c1022",
  },

  headerContainer: {
    marginBottom: 4,
  },

  headerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  amountInput: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    fontSize: 18,
    color: "#ffffff",
  },

  currency: {
    fontSize: 14,
    fontWeight: "700",
    color: "#d1d5db",
  },

  descriptionInput: {
    width: "100%",
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    fontSize: 14,
    color: "#ffffff",
  },

  inputDisabled: {
    opacity: 0.5,
  },

  button: {
    width: "100%",
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.4,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default PaymentComposer;
