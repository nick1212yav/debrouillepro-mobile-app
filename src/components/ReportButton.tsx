// src/components/ReportButton.tsx
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Flag, AlertTriangle, X, ChevronDown } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ConvexError } from "convex/values";

type ReportReason = "spam" | "inappropriate" | "fake" | "harassment" | "other";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "spam", label: "Spam" },
  { id: "inappropriate", label: "Contenu inapproprié" },
  { id: "fake", label: "Faux / Trompeur" },
  { id: "harassment", label: "Harcèlement" },
  { id: "other", label: "Autre" },
];

interface Props {
  publicationId?: Id<"publications">;
  commentId?: Id<"comments">;
  variant?: "icon" | "menu-item";
}

export default function ReportButton({
  publicationId,
  commentId,
  variant = "icon",
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const flagPub = useMutation(api.admin.flagPublication);
  const flagComment = useMutation(api.admin.flagComment);

  const reset = () => {
    setSelectedReason(null);
    setNote("");
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      if (publicationId) {
        await flagPub({
          publicationId,
          reason: selectedReason,
          note: note.trim() || undefined,
        });
      } else if (commentId) {
        await flagComment({
          commentId,
          reason: selectedReason,
          note: note.trim() || undefined,
        });
      }
      Alert.alert("Merci", "Signalement envoyé — merci pour votre vigilance !");
      handleClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const d = err.data as { message?: string };
        Alert.alert("Erreur", d?.message ?? "Erreur lors du signalement");
      } else {
        Alert.alert("Erreur", "Erreur lors du signalement");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger */}
      {variant === "icon" ? (
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.iconTrigger,
            pressed && styles.pressed,
          ]}
          hitSlop={6}
          accessibilityLabel="Signaler"
        >
          <Flag size={13} color="rgba(255,255,255,0.3)" />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.menuItemTrigger,
            pressed && styles.pressed,
          ]}
        >
          <Flag size={14} color="#F87171" />
          <Text style={styles.menuItemText}>Signaler</Text>
        </Pressable>
      )}

      {/* Sheet */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          {/* Backdrop */}
          <Pressable
            onPress={handleClose}
            style={styles.backdrop}
            accessibilityLabel="Fermer"
          />

          {/* Sheet content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetWrapper}
          >
            <View style={styles.sheet}>
              {/* Handle */}
              <View style={styles.handleRow}>
                <View style={styles.handle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <AlertTriangle size={18} color="#FB923C" />
                  <Text style={styles.headerTitle}>Signaler ce contenu</Text>
                </View>
                <Pressable
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={6}
                  accessibilityLabel="Fermer"
                >
                  <X size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>

              {/* Reasons */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Motif du signalement</Text>
                <View style={styles.reasonsColumn}>
                  {REASONS.map(({ id, label }) => {
                    const isSelected = selectedReason === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => setSelectedReason(id)}
                        style={({ pressed }) => [
                          styles.reasonButton,
                          isSelected
                            ? styles.reasonButtonSelected
                            : styles.reasonButtonInactive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.reasonText,
                            isSelected
                              ? styles.reasonTextSelected
                              : styles.reasonTextInactive,
                          ]}
                        >
                          {label}
                        </Text>
                        {isSelected && (
                          <View style={styles.reasonCheckIcon}>
                            <ChevronDown size={14} color="#F87171" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Note */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Détails (optionnel)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Décrivez le problème…"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  maxLength={300}
                  multiline
                  textAlignVertical="top"
                  style={[styles.input, styles.textArea]}
                />
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                disabled={!selectedReason || submitting}
                style={({ pressed }) => [
                  styles.submitButton,
                  (!selectedReason || submitting) && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? "Envoi…" : "Envoyer le signalement"}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Triggers
  iconTrigger: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  menuItemTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    width: "100%",
  },
  menuItemText: {
    color: "#F87171",
    fontSize: 14,
  },

  // Modal shell
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheetWrapper: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#0a0f0b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 20,
  },

  // Handle
  handleRow: {
    alignItems: "center",
    marginTop: -16,
    marginBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // Sections
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Reasons
  reasonsColumn: {
    gap: 8,
  },
  reasonButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  reasonButtonSelected: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.4)",
  },
  reasonButtonInactive: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.07)",
  },
  reasonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  reasonTextSelected: {
    color: "#FFFFFF",
  },
  reasonTextInactive: {
    color: "rgba(255,255,255,0.6)",
  },
  reasonCheckIcon: {
    transform: [{ rotate: "-90deg" }],
  },

  // Input
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 14,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  textArea: {
    minHeight: 80,
  },

  // Submit
  submitButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  // States
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
