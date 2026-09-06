import { View, Text, TextInput, ViewStyle, TextStyle, ImageStyle, Pressable } from "react-native";
// src/features/messages/security/components/BlockUserDialog.tsx

import React, { useEffect, useState } from "react";

export interface BlockUserDialogProps {
  open: boolean;
  userId: string;
  userName?: string;

  onClose: () => void;

  onConfirm: (userId: string, reason?: string) => void;

  isBlocked?: boolean;
}

export function BlockUserDialog({
  open,
  userId,
  userName,
  onClose,
  onConfirm,
  isBlocked = false,
}: BlockUserDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const title = isBlocked
    ? `Débloquer ${userName ?? "cet utilisateur"}`
    : `Bloquer ${userName ?? "cet utilisateur"}`;

  const description = isBlocked
    ? "Cet utilisateur pourra de nouveau vous contacter."
    : "Vous ne recevrez plus de messages de cet utilisateur.";

  const handleConfirm = () => {
    onConfirm(userId, reason.trim() || undefined);
  };

  return (
    <Pressable accessibilityRole="presentation" onPress={onClose} style={overlayStyle}>
      <Pressable
        accessibilityRole="dialog"
        aria-modal="true"
       
        onPress={(event) => event.stopPropagation()}
        style={dialogStyle}
       accessibilityLabelledBy="block-user-title">
        <Text id="block-user-title">{title}</Text>

        <Text style={descriptionStyle}>{description}</Text>

        {!isBlocked && (
          <Text style={labelStyle}>
            Motif (facultatif)
            <TextInput
              value={reason}
              onChangeText={(text) => setReason(text)}
              placeholder="Pourquoi souhaitez-vous bloquer cet utilisateur ?"
             
              style={textareaStyle}
             multiline textAlignVertical="top"/>
          </Text>
        )}

        <View style={actionsStyle}>
          <Pressable type="button" onPress={onClose} style={secondaryButtonStyle}>
            <Text>Annuler</Text></Pressable>

          <Pressable
            type="button"
            onPress={handleConfirm}
            style={primaryButtonStyle}
          >
            {isBlocked ? "Débloquer" : "Bloquer"}
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

const overlayStyle: ViewStyle | TextStyle | ImageStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  background: "rgba(0, 0, 0, 0.45)",
};

const dialogStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  maxWidth: 440,
  padding: 24,
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
};

const descriptionStyle: ViewStyle | TextStyle | ImageStyle = {
  marginTop: 8,
  marginBottom: 20,
  lineHeight: 1.5,
};

const labelStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginBottom: 20,
  fontWeight: 500,
};

const textareaStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  resize: "vertical",
  boxSizing: "border-box",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  font: "inherit",
};

const actionsStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const secondaryButtonStyle: ViewStyle | TextStyle | ImageStyle = {
  border: "1px solid #d1d5db",
  background: "#fff",
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
};

const primaryButtonStyle: ViewStyle | TextStyle | ImageStyle = {
  border: "none",
  background: "#111827",
  color: "#fff",
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
};

export default BlockUserDialog;
