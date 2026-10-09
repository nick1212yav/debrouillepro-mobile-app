// src/features/messages/immo/components/PropertyMessage.tsx

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { PropertyWithMedia } from "../services/immo.service";
import { PropertyPreview } from "./PropertyPreview";

export interface PropertyMessageProps {
  property: PropertyWithMedia;
  isOwn?: boolean;
  isSendingRequest?: boolean;
  requestSent?: boolean;
  error?: string | null;
  onSendVisitRequest?: (message: string, visitDate?: string) => void;
  onOpenProperty?: (property: PropertyWithMedia) => void;
}

export function PropertyMessage({
  property,
  isOwn = false,
  isSendingRequest = false,
  requestSent = false,
  error = null,
  onSendVisitRequest,
  onOpenProperty,
}: PropertyMessageProps) {
  const [message, setMessage] = useState(
    `Bonjour, je suis intéressé(e) par votre bien « ${property.title} ».`,
  );

  const [visitDate, setVisitDate] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();

    if (!onSendVisitRequest || isSendingRequest || !trimmedMessage) {
      return;
    }

    onSendVisitRequest(trimmedMessage, visitDate.trim() || undefined);
  };

  const canSubmit = !isSendingRequest && Boolean(message.trim());

  return (
    <View
      style={[
        styles.wrapper,
        isOwn ? styles.ownWrapper : styles.incomingWrapper,
      ]}
    >
      <PropertyPreview property={property} compact onPress={onOpenProperty} />

      <View style={styles.actions}>
        {!requestSent && !showRequestForm ? (
          <Pressable
            onPress={() => setShowRequestForm(true)}
            accessibilityRole="button"
            accessibilityLabel="Demander une visite"
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>📅 Demander une visite</Text>
          </Pressable>
        ) : null}

        {requestSent ? (
          <View
            style={styles.success}
            accessibilityRole="text"
            accessibilityLabel="Demande de visite envoyée"
          >
            <Text style={styles.successText}>✓ Demande de visite envoyée</Text>
          </View>
        ) : null}
      </View>

      {showRequestForm && !requestSent ? (
        <View style={styles.form}>
          <Text style={styles.label}>Message</Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            style={styles.textarea}
            multiline
            textAlignVertical="top"
            editable={!isSendingRequest}
            accessibilityLabel="Message de demande de visite"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Date souhaitée</Text>

          <TextInput
            value={visitDate}
            onChangeText={setVisitDate}
            style={styles.input}
            editable={!isSendingRequest}
            placeholder="Ex. 25/09/2026"
            placeholderTextColor="#9ca3af"
            accessibilityLabel="Date souhaitée"
          />

          {error ? (
            <View style={styles.error} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formActions}>
            <Pressable
              onPress={() => setShowRequestForm(false)}
              disabled={isSendingRequest}
              accessibilityRole="button"
              accessibilityLabel="Annuler la demande de visite"
              accessibilityState={{
                disabled: isSendingRequest,
              }}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && !isSendingRequest && styles.secondaryButtonPressed,
                isSendingRequest && styles.secondaryButtonDisabled,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Annuler</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Envoyer la demande de visite"
              accessibilityState={{
                disabled: !canSubmit,
                busy: isSendingRequest,
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && canSubmit && styles.primaryButtonPressed,
                !canSubmit && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isSendingRequest ? "Envoi…" : "Envoyer la demande"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 360,
  },

  ownWrapper: {
    alignSelf: "flex-end",
  },

  incomingWrapper: {
    alignSelf: "flex-start",
  },

  actions: {
    marginTop: 9,
  },

  form: {
    marginTop: 10,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    backgroundColor: "#111827",
  },

  label: {
    marginBottom: 5,
    fontSize: 12,
    fontWeight: "700",
    color: "#d1d5db",
  },

  textarea: {
    width: "100%",
    minHeight: 96,
    marginBottom: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    backgroundColor: "#0f172a",
    color: "#ffffff",
  },

  input: {
    width: "100%",
    marginBottom: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    backgroundColor: "#0f172a",
    color: "#ffffff",
  },

  formActions: {
    flexDirection: "row",
    gap: 8,
  },

  primaryButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#2563eb",
  },

  primaryButtonPressed: {
    opacity: 0.82,
  },

  primaryButtonDisabled: {
    opacity: 0.45,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
  },

  secondaryButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    backgroundColor: "#1f2937",
  },

  secondaryButtonPressed: {
    opacity: 0.75,
  },

  secondaryButtonDisabled: {
    opacity: 0.45,
  },

  secondaryButtonText: {
    color: "#e5e7eb",
    fontWeight: "600",
    textAlign: "center",
  },

  success: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.20)",
    borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.10)",
  },

  successText: {
    color: "#34d399",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  error: {
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.20)",
    borderRadius: 9,
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  errorText: {
    color: "#f87171",
    fontSize: 12,
    lineHeight: 18,
  },
});

export default PropertyMessage;
