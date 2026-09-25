import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from "react-native";

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
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={overlayStyle}>
        <Pressable style={backdropStyle} onPress={onClose} />
        <View style={dialogStyle}>
          <Text style={titleStyle}>{title}</Text>
          <Text style={descriptionStyle}>{description}</Text>

          {!isBlocked && (
            <View style={fieldStyle}>
              <Text style={labelStyle}>Motif (facultatif)</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Pourquoi souhaitez-vous bloquer cet utilisateur ?"
                style={textareaStyle}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          <View style={actionsStyle}>
            <Pressable onPress={onClose} style={secondaryButtonStyle}>
              <Text style={secondaryButtonTextStyle}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={primaryButtonStyle}>
              <Text style={primaryButtonTextStyle}>
                {isBlocked ? "Débloquer" : "Bloquer"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const overlayStyle: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const backdropStyle: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.45)",
};

const dialogStyle: ViewStyle = {
  width: "100%",
  maxWidth: 440,
  padding: 24,
  borderRadius: 16,
  backgroundColor: "#fff",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.2,
  shadowRadius: 50,
  elevation: 12,
};

const titleStyle: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
  color: "#111827",
};

const descriptionStyle: TextStyle = {
  marginTop: 8,
  marginBottom: 20,
  fontSize: 14,
  lineHeight: 21,
  color: "#4b5563",
};

const fieldStyle: ViewStyle = {
  marginBottom: 20,
};

const labelStyle: TextStyle = {
  fontSize: 14,
  fontWeight: "500",
  color: "#111827",
  marginBottom: 8,
};

const textareaStyle: TextStyle = {
  width: "100%",
  minHeight: 100,
  padding: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#d1d5db",
  backgroundColor: "#fff",
  fontSize: 14,
  color: "#111827",
};

const actionsStyle: ViewStyle = {
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 10,
};

const secondaryButtonStyle: ViewStyle = {
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#d1d5db",
  backgroundColor: "#fff",
};

const secondaryButtonTextStyle: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#111827",
};

const primaryButtonStyle: ViewStyle = {
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 10,
  backgroundColor: "#111827",
};

const primaryButtonTextStyle: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: "#fff",
};

export default BlockUserDialog;