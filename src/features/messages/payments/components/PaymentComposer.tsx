import {
  Pressable,
  Text,
  View,
  TextInput,
  type ViewStyle,
  type TextStyle,
} from "react-native";

// src/features/messages/payments/components/PaymentComposer.tsx

import React, { useState } from "react";

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

  const handleSubmit = () => {
    if (isDisabled) {
      return;
    }

    const parsedAmount = Number.parseFloat(amount.replace(",", "."));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onSubmit(parsedAmount, currency, description.trim() || undefined);
  };

  const canSubmit = !isDisabled && amount.trim().length > 0;

  return (
    <View style={containerStyle}>
      <View style={headerContainerStyle}>
        <Text style={headerTextStyle}>Envoyer un paiement</Text>
      </View>

      <View style={amountRowStyle}>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          style={amountInputStyle}
          accessibilityLabel="Montant"
          keyboardType="numeric"
          editable={!isDisabled}
        />
        <Text style={currencyStyle}>{currency.toUpperCase()}</Text>
      </View>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Motif du paiement"
        maxLength={200}
        style={descriptionInputStyle}
        accessibilityLabel="Motif du paiement"
        editable={!isDisabled}
      />

      <Pressable
        disabled={!canSubmit}
        onPress={handleSubmit}
        style={[buttonStyle, !canSubmit && buttonDisabledStyle]}
      >
        <Text style={buttonTextStyle}>
          {isLoading ? "Traitement..." : "Continuer"}
        </Text>
      </Pressable>
    </View>
  );
}

const containerStyle: ViewStyle = {
  flexDirection: "column",
  gap: 12,
  padding: 16,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  backgroundColor: "#ffffff",
};

const headerContainerStyle: ViewStyle = {
  marginBottom: 4,
};

const headerTextStyle: TextStyle = {
  fontSize: 15,
  fontWeight: "600",
  color: "#111827",
};

const amountRowStyle: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
};

const amountInputStyle: TextStyle = {
  flex: 1,
  paddingVertical: 12,
  paddingHorizontal: 14,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#d1d5db",
  backgroundColor: "#ffffff",
  fontSize: 18,
  color: "#111827",
};

const currencyStyle: TextStyle = {
  fontWeight: "700",
  fontSize: 14,
  color: "#111827",
};

const descriptionInputStyle: TextStyle = {
  width: "100%",
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#d1d5db",
  backgroundColor: "#ffffff",
  fontSize: 14,
  color: "#111827",
};

const buttonStyle: ViewStyle = {
  width: "100%",
  paddingVertical: 11,
  paddingHorizontal: 14,
  borderRadius: 10,
  backgroundColor: "#111827",
  alignItems: "center",
  justifyContent: "center",
};

const buttonDisabledStyle: ViewStyle = {
  opacity: 0.4,
};

const buttonTextStyle: TextStyle = {
  color: "#fff",
  fontWeight: "600",
  fontSize: 14,
};

export default PaymentComposer;