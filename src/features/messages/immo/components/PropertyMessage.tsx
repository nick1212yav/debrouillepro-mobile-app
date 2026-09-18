import {
  Pressable,
  View,
  TextInput,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import React, { useState } from "react";

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
    if (!onSendVisitRequest || isSendingRequest || !message.trim()) {
      return;
    }

    onSendVisitRequest(message.trim(), visitDate.trim() || undefined);
  };

  return (
    <View
      style={[wrapperStyle, isOwn ? ownWrapperStyle : incomingWrapperStyle]}
    >
      <PropertyPreview property={property} compact onPress={onOpenProperty} />

      <View style={actionsStyle}>
        {!requestSent && !showRequestForm && (
          <Pressable
            onPress={() => setShowRequestForm(true)}
            style={primaryButtonStyle}
            accessibilityRole="button"
            accessibilityLabel="Demander une visite"
          >
            <Text style={primaryButtonTextStyle}>📅 Demander une visite</Text>
          </Pressable>
        )}

        {requestSent && (
          <View style={successStyle}>
            <Text style={successTextStyle}>✓ Demande de visite envoyée</Text>
          </View>
        )}
      </View>

      {showRequestForm && !requestSent && (
        <View style={formStyle}>
          <Text style={labelStyle}>Message</Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            style={textareaStyle}
            multiline
            textAlignVertical="top"
            editable={!isSendingRequest}
            accessibilityLabel="Message de demande de visite"
          />

          <Text style={labelStyle}>Date souhaitée</Text>

          <TextInput
            value={visitDate}
            onChangeText={setVisitDate}
            style={inputStyle}
            editable={!isSendingRequest}
            placeholder="Ex. 25/09/2026"
            placeholderTextColor="#9ca3af"
            accessibilityLabel="Date souhaitée"
          />

          {error && (
            <View style={errorStyle}>
              <Text style={errorTextStyle}>{error}</Text>
            </View>
          )}

          <View style={formActionsStyle}>
            <Pressable
              onPress={() => setShowRequestForm(false)}
              disabled={isSendingRequest}
              style={({ pressed }) => [
                secondaryButtonStyle,
                pressed && !isSendingRequest
                  ? secondaryButtonPressedStyle
                  : undefined,
                isSendingRequest ? secondaryButtonDisabledStyle : undefined,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Annuler"
            >
              <Text style={secondaryButtonTextStyle}>Annuler</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={isSendingRequest || !message.trim()}
              style={({ pressed }) => [
                primaryButtonStyle,
                pressed && !isSendingRequest
                  ? primaryButtonPressedStyle
                  : undefined,
                isSendingRequest || !message.trim()
                  ? primaryButtonDisabledStyle
                  : undefined,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Envoyer la demande"
            >
              <Text style={primaryButtonTextStyle}>
                {isSendingRequest ? "Envoi…" : "Envoyer la demande"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const wrapperStyle: ViewStyle = {
  width: "100%",
  maxWidth: 360,
};

const ownWrapperStyle: ViewStyle = {
  alignSelf: "flex-end",
};

const incomingWrapperStyle: ViewStyle = {
  alignSelf: "flex-start",
};

const actionsStyle: ViewStyle = {
  marginTop: 9,
};

const formStyle: ViewStyle = {
  marginTop: 10,
  padding: 13,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#e5e7eb",
  backgroundColor: "#ffffff",
};

const labelStyle: TextStyle = {
  marginBottom: 5,
  fontSize: 12,
  fontWeight: "700",
  color: "#374151",
};

const textareaStyle: TextStyle = {
  width: "100%",
  paddingHorizontal: 11,
  paddingVertical: 10,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#d1d5db",
  marginBottom: 10,
  color: "#111827",
  minHeight: 96,
};

const inputStyle: TextStyle = {
  width: "100%",
  paddingHorizontal: 11,
  paddingVertical: 10,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#d1d5db",
  marginBottom: 10,
  color: "#111827",
};

const formActionsStyle: ViewStyle = {
  flexDirection: "row",
  gap: 8,
};

const primaryButtonStyle: ViewStyle = {
  flex: 1,
  minHeight: 42,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
  backgroundColor: "#111827",
  justifyContent: "center",
  alignItems: "center",
};

const primaryButtonPressedStyle: ViewStyle = {
  opacity: 0.82,
};

const primaryButtonDisabledStyle: ViewStyle = {
  opacity: 0.45,
};

const primaryButtonTextStyle: TextStyle = {
  color: "#ffffff",
  fontWeight: "700",
  textAlign: "center",
};

const secondaryButtonStyle: ViewStyle = {
  flex: 1,
  minHeight: 42,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 10,
  backgroundColor: "#ffffff",
  justifyContent: "center",
  alignItems: "center",
};

const secondaryButtonPressedStyle: ViewStyle = {
  opacity: 0.75,
};

const secondaryButtonDisabledStyle: ViewStyle = {
  opacity: 0.45,
};

const secondaryButtonTextStyle: TextStyle = {
  color: "#374151",
  fontWeight: "600",
  textAlign: "center",
};

const successStyle: ViewStyle = {
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 10,
  backgroundColor: "#ecfdf5",
};

const successTextStyle: TextStyle = {
  color: "#047857",
  fontSize: 13,
  fontWeight: "700",
  textAlign: "center",
};

const errorStyle: ViewStyle = {
  marginBottom: 10,
  paddingHorizontal: 10,
  paddingVertical: 9,
  borderRadius: 9,
  backgroundColor: "#fef2f2",
};

const errorTextStyle: TextStyle = {
  color: "#b91c1c",
  fontSize: 12,
};
