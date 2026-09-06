import { Picker } from "@react-native-picker/picker";
import { View, Text, TextInput, ViewStyle, TextStyle, ImageStyle, Pressable } from "react-native";
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
  {
    value: "spam",
    label: "Spam",
  },
  {
    value: "inappropriate",
    label: "Contenu inapproprié",
  },
  {
    value: "harassment",
    label: "Harcèlement",
  },
  {
    value: "threat",
    label: "Menace",
  },
  {
    value: "scam",
    label: "Arnaque",
  },
  {
    value: "other",
    label: "Autre",
  },
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

  if (!open) {
    return null;
  }

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
    <Pressable accessibilityRole="presentation" onPress={onClose} style={overlayStyle}>
      <Pressable
        accessibilityRole="dialog"
        aria-modal="true"
       
        onPress={(event) => event.stopPropagation()}
        style={dialogStyle}
       accessibilityLabelledBy="report-message-title">
        <Text id="report-message-title">Signaler le message</Text>

        <Text style={descriptionStyle}>Sélectionnez la raison du signalement.</Text>

        <Text style={labelStyle}>
          Raison
          <Picker
           
            onValueChange={(event) => setReason(event.target.value as ReportReason)}
            style={inputStyle}
           selectedValue={reason}>
            {REPORT_REASONS.map((item) => (
              <Picker.Item label={`${item.label}`} value={item.value} />
            ))}
          </Picker>
        </Text>

        <Text style={labelStyle}>
          Détails (facultatif)
          <TextInput
            value={description}
            onChangeText={(text) => setDescription(text)}
            placeholder="Ajoutez des informations utiles au signalement."
           
            style={textareaStyle}
           multiline textAlignVertical="top"/>
        </Text>

        <View style={actionsStyle}>
          <Pressable type="button" onPress={onClose} style={secondaryButtonStyle}>
            <Text>Annuler</Text></Pressable>

          <Pressable
            type="button"
            onPress={handleConfirm}
            style={primaryButtonStyle}
          >
            <Text>Signaler</Text></Pressable>
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
  marginBottom: 16,
  fontWeight: 500,
};

const inputStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
  font: "inherit",
};

const textareaStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  boxSizing: "border-box",
  resize: "vertical",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d1d5db",
  font: "inherit",
};

const actionsStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 20,
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

export default ReportMessageDialog;
