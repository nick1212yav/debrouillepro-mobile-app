import { View, Text, Pressable, TextInput, Linking } from "react-native";
// src/features/messages/locations/components/LocationPicker.tsx

import { useEffect, useState } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import {
  getGoogleMapsUrl,
  type Coordinates,
} from "../services/locations.service";

import { useLocation } from "../hooks/useLocation";
import { usePathname } from "expo-router";

export interface LocationPickerProps {
  open?: boolean;

  conversationId: Id<"conversations"> | undefined;

  onClose?: () => void;

  onSent?: () => void;

  onStartLive?: () => void;
}

export function LocationPicker({
  open = true,
  conversationId,
  onClose,
  onSent,
  onStartLive,
}: LocationPickerProps) {
  const {
    currentPosition,
    isLocating,
    error,
    getCurrentPosition,
    sendLocation,
  } = usePathname();

  const [label, setLabel] = useState("");

  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open && !currentPosition && !isLocating) {
      getCurrentPosition();
    }
  }, [open, currentPosition, isLocating, getCurrentPosition]);

  if (!open) {
    return null;
  }

  const handleSend = async () => {
    if (!conversationId || !currentPosition) {
      return;
    }

    setIsSending(true);

    try {
      await sendLocation({
        conversationId,
        coordinates: currentPosition,
        label: label.trim() || undefined,
      });

      onSent?.();
      onClose?.();
    } finally {
      setIsSending(false);
    }
  };

  const openMap = (coordinates: Coordinates) => {
    Linking.openURL(String(getGoogleMapsUrl(coordinates.latitude, coordinates.longitude)));
  };

  return (
    <View
      accessibilityRole="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.55)" }}
    >
      <View
        style={{ width: "100%", maxWidth: 460, overflow: "hidden", borderRadius: 20, backgroundColor: "#fff" }}
      >
        {/* HEADER */}
        <View
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", borderBottomStyle: "solid" }}
        >
          <View>
            <Text
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              Partager ma position
            </Text>

            <Text
              style={{
                margin: "4px 0 0",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              Votre position actuelle
            </Text>
          </View>

          {onClose && (
            <Pressable
             
              onPress={onClose}
              style={{ width: 34, height: 34, borderWidth: 0, borderRadius: "50%", backgroundColor: "#f1f5f9" }}
            >
              <Text>×</Text></Pressable>
          )}
        </View>

        {/* CONTENT */}
        <View
          style={{
            padding: 16,
          }}
        >
          {error && (
            <View
              style={{ marginBottom: 14, padding: 12, borderRadius: 12, backgroundColor: "#fef2f2" }}
            >
              {error}

              <Pressable
               
                onPress={getCurrentPosition}
                style={{ display: "block", marginTop: 8, borderWidth: 0, backgroundColor: "transparent", padding: 0 }}
              >
                <Text>Réessayer</Text></Pressable>
            </View>
          )}

          {!currentPosition && isLocating ? (
            <View
              style={{ padding: 35 }}
            >
              <View
                style={{ marginBottom: 10 }}
              >
                <Text>📍</Text></View>
              <Text>Détermination de votre position...</Text></View>
          ) : currentPosition ? (
            <>
              {/* MAP */}
              <View
                style={{ position: "relative", height: 190, overflow: "hidden", borderRadius: 16, backgroundColor: "#e2e8f0", marginBottom: 14 }}
              >
                <View
                  title="Position actuelle"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    currentPosition.longitude - 0.005
                  }%2C${currentPosition.latitude - 0.005}%2C${
                    currentPosition.longitude + 0.005
                  }%2C${currentPosition.latitude + 0.005}&layer=mapnik&marker=${
                    currentPosition.latitude
                  }%2C${currentPosition.longitude}`}
                  style={{ width: "100%", height: "100%", borderWidth: 0 }}
                  loading="lazy"
                />

                <View
                  style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 20, height: 20, borderRadius: "50%", backgroundColor: "#ef4444", borderWidth: 3, borderColor: "#fff", borderStyle: "solid" }}
                />
              </View>

              {/* COORDINATES */}
              <View
                style={{ padding: 12, borderRadius: 12, backgroundColor: "#f8fafc", marginBottom: 12 }}
              >
                <View
                  style={{  }}
                >
                  <Text>📍 Position actuelle</Text></View>

                <View
                  style={{ marginTop: 5 }}
                >
                  {currentPosition.latitude.toFixed(6)}
                  {" · "}
                  {currentPosition.longitude.toFixed(6)}
                </View>

                {currentPosition.accuracy !== undefined && (
                  <View
                    style={{ marginTop: 4 }}
                  >
                    <Text>Précision ≈</Text>{Math.round(currentPosition.accuracy)}<Text>m</Text></View>
                )}
              </View>

              {/* LABEL */}
              <TextInput
                value={label}
                onChangeText={(text) => setLabel(text)}
                placeholder="Ajouter une indication (facultatif)"
                style={{ width: "100%", paddingVertical: 11, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: "#dbe1ea", borderStyle: "solid", fontSize: 13, marginBottom: 12 }}
              />

              {/* ACTIONS */}
              <View
                style={{ display: "grid", gap: 8 }}
              >
                <Pressable
                  type="button"
                  onPress={() => openMap(currentPosition)}
                  style={{ paddingVertical: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 11, backgroundColor: "#fff" }}
                >
                  <Text>🗺️ Voir la carte</Text></Pressable>

                <Pressable
                  type="button"
                  disabled={isSending || !conversationId}
                  onPress={() => void handleSend()}
                  style={{ paddingVertical: 11, paddingHorizontal: 12, borderWidth: 0, borderRadius: 11, backgroundColor: isSending || !conversationId ? "#cbd5e1" : "#111827" }}
                >
                  {isSending ? "Envoi..." : "📍 Envoyer"}
                </Pressable>
              </View>

              {/* LIVE */}
              {onStartLive && (
                <Pressable
                  type="button"
                  onPress={onStartLive}
                  style={{ width: "100%", marginTop: 9, paddingVertical: 11, paddingHorizontal: 12, borderWidth: 0, borderRadius: 11, backgroundColor: "#eff6ff" }}
                >
                  <Text>📡 Partager ma position en direct</Text></Pressable>
              )}
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default LocationPicker;
