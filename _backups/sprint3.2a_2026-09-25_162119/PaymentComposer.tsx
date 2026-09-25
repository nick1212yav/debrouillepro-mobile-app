import { Pressable, Text, View, TextInput, NativeSyntheticEvent, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";

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

  const handleSubmit = (event: NativeSyntheticEvent<any>) => {
    event.preventDefault();

    const parsedAmount = Number.parseFloat(amount.replace(",", "."));

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onSubmit(parsedAmount, currency, description.trim() || undefined);
  };

  const isDisabled = disabled || isLoading;

  return (
    <View style={containerStyle}><View style={headerStyle}><strong>Envoyer un paiement</strong></View><View style={amountRowStyle}><TextInput inputMode="decimal" value={amount} onChangeText={(value) => setAmount(value)} placeholder="0,00" style={amountInputStyle} accessibilityLabel="Montant" keyboardType="numeric" editable={!(isDisabled)} /><Text style={currencyStyle}>{currency.toUpperCase()}</Text></View><TextInput value={description} onChangeText={(value) => setDescription(value)} placeholder="Motif du paiement" maxLength={200} style={descriptionStyle} accessibilityLabel="Motif du paiement" editable={!(isDisabled)} /><Pressable disabled={isDisabled || !amount} style={buttonStyle}>{isLoading ? "Traitement…" : "Continuer"}</Pressable></View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const containerStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 16,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
};

const headerStyle: ViewStyle | TextStyle | ImageStyle = {
  fontSize: 15,
};

const amountRowStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const amountInputStyle: ViewStyle | TextStyle | ImageStyle = {
  flex: 1,
  minWidth: 0,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 18,
};

const currencyStyle: ViewStyle | TextStyle | ImageStyle = {
  fontWeight: 700,
  fontSize: 14,
};

const descriptionStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
};

const buttonStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  padding: "11px 14px",
  border: "none",
  borderRadius: 10,
  background: "#111827",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

export default PaymentComposer;
