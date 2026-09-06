import { Pressable, View, TextInput, Text, ViewStyle, TextStyle, ImageStyle } from "react-native";

// src/features/messages/immo/components/PropertyMessage.tsx

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

  const handleSubmit = (event: unknown) => {
    if (!onSendVisitRequest) {
      return;
    }

    onSendVisitRequest(message, visitDate || undefined);
  };

  return (
    <View
      style={{
        ...wrapperStyle,
        alignSelf: isOwn ? "flex-end" : "flex-start",
      }}
    >
      <PropertyPreview property={property} compact onPress={onOpenProperty} />

      <View style={actionsStyle}>
        {!requestSent && !showRequestForm && (
          <Pressable
            onPress={() => setShowRequestForm(true)}
            style={primaryButtonStyle}
          >
            📅 Demander une visite
          </Pressable>
        )}

        {requestSent && (
          <View style={successStyle}>✓ Demande de visite envoyée</View>
        )}
      </View>

      {showRequestForm && !requestSent && (
        <View style={formStyle}>
          <Text style={labelStyle}>Message</Text>

          <TextInput
            value={message}
            onChangeText={(text) => setMessage(text)}
            disabled={isSendingRequest}
            style={textareaStyle} multiline textAlignVertical="top"
          />

          <Text style={labelStyle}>Date souhaitée</Text>

          <TextInput
            value={visitDate}
            onChangeText={(text) => setVisitDate(text)}
            disabled={isSendingRequest}
            style={inputStyle}
          />

          {error && <View style={errorStyle}>{error}</View>}

          <View style={formActionsStyle}>
            <Pressable
              onPress={() => setShowRequestForm(false)}
              disabled={isSendingRequest}
              style={secondaryButtonStyle}
            >
              <Text>Annuler</Text></Pressable>

            <Pressable
              disabled={isSendingRequest || !message.trim()}
              style={primaryButtonStyle}
            >
              {isSendingRequest ? "Envoi…" : "Envoyer la demande"}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const wrapperStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "min(360px, 100%)",
};

const actionsStyle: ViewStyle | TextStyle | ImageStyle = {
  marginTop: 9,
};

const formStyle: ViewStyle | TextStyle | ImageStyle = {
  marginTop: 10,
  padding: 13,
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
};

const labelStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  marginBottom: 5,
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
};

const textareaStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  boxSizing: "border-box",
  resize: "vertical",
  padding: "10px 11px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 10,
  fontFamily: "inherit",
};

const inputStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 11px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  marginBottom: 10,
};

const formActionsStyle: ViewStyle | TextStyle | ImageStyle = {
  display: "flex",
  gap: 8,
};

const primaryButtonStyle: ViewStyle | TextStyle | ImageStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "none",
  borderRadius: 10,
  background: "#111827",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: ViewStyle | TextStyle | ImageStyle = {
  flex: 1,
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  background: "#ffffff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
};

const successStyle: ViewStyle | TextStyle | ImageStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  background: "#ecfdf5",
  color: "#047857",
  fontSize: 13,
  fontWeight: 700,
  textAlign: "center",
};

const errorStyle: ViewStyle | TextStyle | ImageStyle = {
  marginBottom: 10,
  padding: "9px 10px",
  borderRadius: 9,
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: 12,
};

export default PropertyMessage;
