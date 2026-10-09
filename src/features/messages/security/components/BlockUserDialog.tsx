// src/features/messages/security/components/BlockUserDialog.tsx

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";

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

  const displayName = userName?.trim() || "cet utilisateur";

  const title = isBlocked
    ? `Débloquer ${displayName}`
    : `Bloquer ${displayName}`;

  const description = isBlocked
    ? "Cet utilisateur pourra de nouveau vous contacter."
    : "Vous ne recevrez plus de messages de cet utilisateur.";

  const handleConfirm = () => {
    const normalizedReason = reason.trim();

    onConfirm(userId, normalizedReason || undefined);
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
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.description}>{description}</Text>

          {!isBlocked && (
            <View style={styles.field}>
              <Text style={styles.label}>Motif (facultatif)</Text>

              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Pourquoi souhaitez-vous bloquer cet utilisateur ?"
                placeholderTextColor="#94A3B8"
                style={styles.textarea}
                multiline
                textAlignVertical="top"
                maxLength={500}
                accessibilityLabel="Motif du blocage"
              />
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Annuler"
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isBlocked ? "Débloquer" : "Bloquer"}
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isBlocked ? "Débloquer" : "Bloquer"}
              </Text>
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
  } satisfies ViewStyle,

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 4, 12, 0.72)",
  } satisfies ViewStyle,

  dialog: {
    width: "100%",
    maxWidth: 440,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#0C1022",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 16,
  } satisfies ViewStyle,

  title: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "700",
    color: "#FFFFFF",
  } satisfies TextStyle,

  description: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 21,
    color: "#CBD5E1",
  } satisfies TextStyle,

  field: {
    marginBottom: 20,
  } satisfies ViewStyle,

  label: {
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#E2E8F0",
  } satisfies TextStyle,

  textarea: {
    width: "100%",
    minHeight: 104,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
  } satisfies TextStyle,

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  } satisfies ViewStyle,

  secondaryButton: {
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
  } satisfies ViewStyle,

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0",
  } satisfies TextStyle,

  primaryButton: {
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#DC2626",
  } satisfies ViewStyle,

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  } satisfies TextStyle,

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  } satisfies ViewStyle,
});

export default BlockUserDialog;
