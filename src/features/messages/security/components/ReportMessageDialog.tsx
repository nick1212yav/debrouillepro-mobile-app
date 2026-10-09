// src/features/messages/security/components/ReportMessageDialog.tsx

import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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

  const handleConfirm = () => {
    const normalizedDescription = description.trim();

    onConfirm({
      messageId,
      conversationId,
      reportedUserId,
      reportedBy,
      reason,
      description: normalizedDescription || undefined,
    });
  };

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View accessibilityViewIsModal style={styles.dialog}>
          <Text style={styles.title}>Signaler le message</Text>

          <Text style={styles.description}>
            Sélectionnez la raison du signalement.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Raison</Text>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reason}
                onValueChange={(value) => setReason(value as ReportReason)}
                dropdownIconColor="#CBD5E1"
                style={styles.picker}
                accessibilityLabel="Raison du signalement"
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

          <View style={styles.field}>
            <Text style={styles.label}>Détails (facultatif)</Text>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ajoutez des informations utiles au signalement."
              placeholderTextColor="#94A3B8"
              style={styles.textarea}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              accessibilityLabel="Détails du signalement"
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Signaler le message"
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Signaler</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 4, 12, 0.72)",
  },

  dialog: {
    width: "100%",
    maxWidth: 440,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0C1022",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 16,
  },

  title: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  description: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 21,
    color: "#CBD5E1",
  },

  field: {
    marginBottom: 16,
  },

  label: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#E2E8F0",
  },

  pickerContainer: {
    minHeight: 50,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  picker: {
    color: "#FFFFFF",
  },

  textarea: {
    width: "100%",
    minHeight: 104,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },

  secondaryButton: {
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0",
  },

  primaryButton: {
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#DC2626",
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});

export default ReportMessageDialog;
