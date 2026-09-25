import { Picker } from "@react-native-picker/picker";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from "react-native";

// src/features/messages/security/components/ReportMessageDialog.tsx

import React, { useEffect, useState } from "react";

import type { ReportReason } from "../services/security.service";

export interface ReportMessageDialogProps {
  open: boolean;
  messageId: string;
  conversationId?: string;
  reportedUserId?: string;
  reportedBy?: string;
  onClose: () => void;
  onConfirm: (input: {
    messageId: string;
    conversationId?: string;
    reportedUserId?: string;
    reportedBy?: string;
    reason: ReportReason;
    description?: string;
  }) => void;
}

const REPORT_REASONS: Array<{
  value: ReportReason;
  label: string;
}> = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "harassment", label: "Harcèlement" },
  { value: "threat", label: "Menace" },
  { value: "scam", label: "Arnaque" },
  { value: "other", label: "Autre" },
];

export function ReportMessageDialog({
  open,
  messageId,
  conversationId,
  reportedUserId,
  reportedBy,
  onClose,
  onConfirm,
}: ReportMessageDialogProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("spam");
      setDescription("");
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm({
      messageId,
      conversationId,
      reportedUserId,
      reportedBy,
      reason,
      description: description.trim() || undefined,
    });
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
          <Text style={titleStyle}>Signaler le message</Text>
          <Text style={descriptionStyle}>
            Sélectionnez la raison du signalement.
          </Text>

          <View style={fieldStyle}>
            <Text style={labelStyle}>Raison</Text>
            <View style={pickerContainerStyle}>
              <Picker
                onValueChange={(value) => setReason(value as ReportReason)}
                selectedValue={reason}
              >
                {REPORT_REASONS.map((item) => (
                  <Picker.Item
                    key={item.value}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={fieldStyle}>
            <Text style={labelStyle}>Détails (facultatif)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ajoutez des informations utiles au signalement."
              style={textareaStyle}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={actionsStyle}>
            <Pressable onPress={onClose} style={secondaryButtonStyle}>
              <Text style={secondaryButtonTextStyle}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={primaryButtonStyle}>
              <Text style={primaryButtonTextStyle}>Signaler</Text>
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
  color: "#4b5563",
};

const fieldStyle: ViewStyle = {
  marginBottom: 16,
};

const labelStyle: TextStyle = {
  fontSize: 14,
  fontWeight: "500",
  color: "#111827",
  marginBottom: 8,
};

const pickerContainerStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 10,
  backgroundColor: "#fff",
  overflow: "hidden",
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
  marginTop: 20,
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

export default ReportMessageDialog;