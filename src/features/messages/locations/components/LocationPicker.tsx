import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

// src/features/messages/locations/components/LocationPicker.tsx

import { useEffect, useState } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import {
  getGoogleMapsUrl,
  type Coordinates,
} from "../services/locations.service";

import { useLocation } from "../hooks/useLocation";

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
  } = useLocation();

  const [label, setLabel] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open && !currentPosition && !isLocating) {
      getCurrentPosition();
    }
  }, [open, currentPosition, isLocating, getCurrentPosition]);

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
    Linking.openURL(
      String(getGoogleMapsUrl(coordinates.latitude, coordinates.longitude)),
    );
  };

  const canSend = !!conversationId && !!currentPosition && !isSending;

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Partager ma position</Text>
              <Text style={styles.subtitle}>Votre position actuelle</Text>
            </View>
            {onClose && (
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Fermer"
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.body}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  onPress={getCurrentPosition}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Réessayer</Text>
                </Pressable>
              </View>
            )}

            {!currentPosition && isLocating ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="large" color="#64748b" />
                <Text style={styles.loadingText}>
                  Détermination de votre position...
                </Text>
              </View>
            ) : currentPosition ? (
              <>
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapIcon}>📍</Text>
                  <Text style={styles.mapCoords}>
                    {currentPosition.latitude.toFixed(6)}
                    {" · "}
                    {currentPosition.longitude.toFixed(6)}
                  </Text>
                  {currentPosition.accuracy !== undefined && (
                    <Text style={styles.mapAccuracy}>
                      Précision ≈ {Math.round(currentPosition.accuracy)}m
                    </Text>
                  )}
                </View>

                <View style={styles.coordinatesBox}>
                  <Text style={styles.coordinatesTitle}>
                    📍 Position actuelle
                  </Text>
                  <Text style={styles.coordinatesValue}>
                    {currentPosition.latitude.toFixed(6)}
                    {" · "}
                    {currentPosition.longitude.toFixed(6)}
                  </Text>
                  {currentPosition.accuracy !== undefined && (
                    <Text style={styles.coordinatesAccuracy}>
                      Précision ≈ {Math.round(currentPosition.accuracy)}m
                    </Text>
                  )}
                </View>

                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Ajouter une indication (facultatif)"
                  style={styles.labelInput}
                />

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openMap(currentPosition)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>
                      🗺️ Voir la carte
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={!canSend}
                    onPress={() => void handleSend()}
                    style={[
                      styles.primaryButton,
                      !canSend && styles.primaryButtonDisabled,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSending ? "Envoi..." : "📍 Envoyer"}
                    </Text>
                  </Pressable>
                </View>

                {onStartLive && (
                  <Pressable
                    onPress={onStartLive}
                    style={styles.liveButton}
                  >
                    <Text style={styles.liveButtonText}>
                      📡 Partager ma position en direct
                    </Text>
                  </Pressable>
                )}
              </>
            ) : null}
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  dialog: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.3,
    shadowRadius: 70,
    elevation: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 12,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 18,
    color: "#111827",
  },
  body: {
    padding: 16,
  },
  errorBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
  },
  retryButton: {
    marginTop: 8,
  },
  retryText: {
    fontWeight: "700",
    fontSize: 13,
    color: "#b91c1c",
  },
  loadingBlock: {
    padding: 35,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
  },
  mapPlaceholder: {
    height: 190,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  mapIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  mapCoords: {
    fontSize: 12,
    color: "#4b5563",
  },
  mapAccuracy: {
    marginTop: 4,
    fontSize: 11,
    color: "#6b7280",
  },
  coordinatesBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 12,
  },
  coordinatesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  coordinatesValue: {
    marginTop: 5,
    fontSize: 11,
    color: "#4b5563",
  },
  coordinatesAccuracy: {
    marginTop: 4,
    fontSize: 11,
    color: "#6b7280",
  },
  labelInput: {
    width: "100%",
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe1ea",
    fontSize: 13,
    marginBottom: 12,
    color: "#111827",
  },
  actions: {
    gap: 8,
  },
  secondaryButton: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#111827",
  },
  primaryButton: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  primaryButtonText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#fff",
  },
  liveButton: {
    marginTop: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: "#eff6ff",
    alignItems: "center",
  },
  liveButtonText: {
    fontWeight: "800",
    fontSize: 12,
    color: "#1d4ed8",
  },
});

export default LocationPicker;