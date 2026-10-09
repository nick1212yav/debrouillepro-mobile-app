// src/features/messages/locations/components/LocationPicker.tsx

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Id } from "../../../../../convex/_generated/dataModel";

import { useLocation } from "../hooks/useLocation";
import {
  getGoogleMapsUrl,
  type Coordinates,
} from "../services/locations.service";

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
      void getCurrentPosition();
    }
  }, [open, currentPosition, isLocating, getCurrentPosition]);

  const handleSend = useCallback(async () => {
    if (!conversationId || !currentPosition || isSending) {
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
  }, [
    conversationId,
    currentPosition,
    isSending,
    sendLocation,
    label,
    onSent,
    onClose,
  ]);

  const openMap = useCallback((coordinates: Coordinates) => {
    void Linking.openURL(
      String(getGoogleMapsUrl(coordinates.latitude, coordinates.longitude)),
    );
  }, []);

  const canSend =
    Boolean(conversationId) && Boolean(currentPosition) && !isSending;

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer le partage de position"
        />

        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>📍</Text>
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title}>Partager ma position</Text>

                <Text style={styles.subtitle}>Votre position actuelle</Text>
              </View>
            </View>

            {onClose ? (
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.body}>
            {error ? (
              <View style={styles.errorBox}>
                <View style={styles.errorHeader}>
                  <Text style={styles.errorIcon}>⚠️</Text>

                  <Text style={styles.errorTitle}>
                    Localisation indisponible
                  </Text>
                </View>

                <Text style={styles.errorText}>{error}</Text>

                <Pressable
                  onPress={() => void getCurrentPosition()}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Réessayer de déterminer ma position"
                >
                  <Text style={styles.retryText}>Réessayer</Text>
                </Pressable>
              </View>
            ) : null}

            {!currentPosition && isLocating ? (
              <View style={styles.loadingBlock}>
                <View style={styles.loadingIcon}>
                  <ActivityIndicator size="large" color="#60a5fa" />
                </View>

                <Text style={styles.loadingTitle}>
                  Détermination de votre position
                </Text>

                <Text style={styles.loadingText}>
                  Veuillez patienter quelques instants...
                </Text>
              </View>
            ) : currentPosition ? (
              <>
                <View style={styles.mapPlaceholder}>
                  <View style={styles.mapGrid}>
                    <View style={styles.gridLineHorizontal} />
                    <View style={styles.gridLineHorizontalSecondary} />
                    <View style={styles.gridLineVertical} />
                    <View style={styles.gridLineVerticalSecondary} />
                  </View>

                  <View style={styles.mapPin}>
                    <View style={styles.mapPinCircle}>
                      <Text style={styles.mapIcon}>📍</Text>
                    </View>

                    <View style={styles.mapPinShadow} />
                  </View>

                  <View style={styles.mapOverlay}>
                    <Text style={styles.mapCoords}>
                      {currentPosition.latitude.toFixed(6)}
                      {" · "}
                      {currentPosition.longitude.toFixed(6)}
                    </Text>

                    {currentPosition.accuracy !== undefined ? (
                      <Text style={styles.mapAccuracy}>
                        Précision ≈ {Math.round(currentPosition.accuracy)} m
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.locationBadge}>
                    <View style={styles.locationBadgeDot} />

                    <Text style={styles.locationBadgeText}>
                      POSITION DÉTECTÉE
                    </Text>
                  </View>
                </View>

                <View style={styles.coordinatesBox}>
                  <View style={styles.coordinatesHeader}>
                    <Text style={styles.coordinatesTitle}>
                      📍 Position actuelle
                    </Text>

                    {currentPosition.accuracy !== undefined ? (
                      <Text style={styles.accuracyBadge}>
                        ±{Math.round(currentPosition.accuracy)} m
                      </Text>
                    ) : null}
                  </View>

                  <Text style={styles.coordinatesValue}>
                    {currentPosition.latitude.toFixed(6)}
                    {" · "}
                    {currentPosition.longitude.toFixed(6)}
                  </Text>

                  {currentPosition.accuracy !== undefined ? (
                    <Text style={styles.coordinatesAccuracy}>
                      Précision estimée à environ{" "}
                      {Math.round(currentPosition.accuracy)} mètres
                    </Text>
                  ) : null}
                </View>

                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Ajouter une indication (facultatif)"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={styles.labelInput}
                  maxLength={200}
                  editable={!isSending}
                  accessibilityLabel="Indication de localisation"
                />

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openMap(currentPosition)}
                    accessibilityRole="button"
                    accessibilityLabel="Voir ma position sur la carte"
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.secondaryButtonIcon}>🗺️</Text>

                    <Text style={styles.secondaryButtonText}>
                      Voir la carte
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={!canSend}
                    onPress={() => void handleSend()}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isSending
                        ? "Envoi de la position en cours"
                        : "Envoyer ma position"
                    }
                    accessibilityState={{
                      disabled: !canSend,
                      busy: isSending,
                    }}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      !canSend && styles.primaryButtonDisabled,
                      pressed && canSend && styles.buttonPressed,
                    ]}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryButtonIcon}>📍</Text>
                    )}

                    <Text style={styles.primaryButtonText}>
                      {isSending ? "Envoi..." : "Envoyer"}
                    </Text>
                  </Pressable>
                </View>

                {onStartLive ? (
                  <Pressable
                    onPress={onStartLive}
                    disabled={isSending}
                    accessibilityRole="button"
                    accessibilityLabel="Partager ma position en direct"
                    accessibilityState={{
                      disabled: isSending,
                    }}
                    style={({ pressed }) => [
                      styles.liveButton,
                      isSending && styles.liveButtonDisabled,
                      pressed && !isSending && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.liveButtonIcon}>📡</Text>

                    <View style={styles.liveButtonContent}>
                      <Text style={styles.liveButtonText}>
                        Partager en direct
                      </Text>

                      <Text style={styles.liveButtonSubtext}>
                        Votre position sera mise à jour en temps réel
                      </Text>
                    </View>

                    <Text style={styles.liveButtonArrow}>›</Text>
                  </Pressable>
                ) : null}
              </>
            ) : !error ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyIcon}>📍</Text>

                <Text style={styles.emptyTitle}>Position non disponible</Text>

                <Text style={styles.emptyText}>
                  Impossible de déterminer votre position pour le moment.
                </Text>

                <Pressable
                  onPress={() => void getCurrentPosition()}
                  style={({ pressed }) => [
                    styles.retryPrimaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Déterminer ma position"
                >
                  <Text style={styles.retryPrimaryButtonText}>
                    Déterminer ma position
                  </Text>
                </Pressable>
              </View>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  dialog: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "92%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 22,
    backgroundColor: "#080d1a",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.4,
    shadowRadius: 70,
    elevation: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  headerIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(37,99,235,0.14)",
  },

  headerIconText: {
    fontSize: 21,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },

  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  closeText: {
    marginTop: -2,
    fontSize: 23,
    fontWeight: "300",
    color: "rgba(255,255,255,0.72)",
  },

  body: {
    padding: 16,
  },

  errorBox: {
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.18)",
    borderRadius: 13,
    backgroundColor: "rgba(127,29,29,0.16)",
  },

  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  errorIcon: {
    fontSize: 14,
  },

  errorTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#fca5a5",
  },

  errorText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.58)",
  },

  retryButton: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: "rgba(248,113,113,0.10)",
  },

  retryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fca5a5",
  },

  loadingBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },

  loadingIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: "rgba(96,165,250,0.10)",
  },

  loadingTitle: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    color: "#ffffff",
  },

  loadingText: {
    marginTop: 5,
    fontSize: 11,
    textAlign: "center",
    color: "rgba(255,255,255,0.42)",
  },

  mapPlaceholder: {
    position: "relative",
    height: 190,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: "#111c31",
  },

  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },

  gridLineHorizontal: {
    position: "absolute",
    top: "34%",
    left: -20,
    right: -20,
    height: 1,
    backgroundColor: "#64748b",
    transform: [{ rotate: "-8deg" }],
  },

  gridLineHorizontalSecondary: {
    position: "absolute",
    top: "69%",
    left: -20,
    right: -20,
    height: 1,
    backgroundColor: "#64748b",
    transform: [{ rotate: "7deg" }],
  },

  gridLineVertical: {
    position: "absolute",
    top: -30,
    bottom: -30,
    left: "34%",
    width: 1,
    backgroundColor: "#64748b",
    transform: [{ rotate: "10deg" }],
  },

  gridLineVerticalSecondary: {
    position: "absolute",
    top: -30,
    bottom: -30,
    left: "68%",
    width: 1,
    backgroundColor: "#64748b",
    transform: [{ rotate: "-8deg" }],
  },

  mapPin: {
    alignItems: "center",
    justifyContent: "center",
  },

  mapPinCircle: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.55)",
    borderRadius: 30,
    backgroundColor: "rgba(37,99,235,0.28)",
  },

  mapIcon: {
    fontSize: 29,
  },

  mapPinShadow: {
    width: 23,
    height: 6,
    marginTop: 5,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  mapOverlay: {
    position: "absolute",
    right: 10,
    bottom: 10,
    left: 10,
    alignItems: "center",
  },

  mapCoords: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "rgba(2,6,23,0.78)",
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
  },

  mapAccuracy: {
    marginTop: 4,
    fontSize: 9,
    color: "rgba(255,255,255,0.48)",
  },

  locationBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(22,101,52,0.86)",
  },

  locationBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ade80",
  },

  locationBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "#dcfce7",
  },

  coordinatesBox: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  coordinatesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  coordinatesTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
  },

  accuracyBadge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "rgba(74,222,128,0.08)",
    fontSize: 9,
    fontWeight: "800",
    color: "#86efac",
  },

  coordinatesValue: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.62)",
  },

  coordinatesAccuracy: {
    marginTop: 4,
    fontSize: 10,
    color: "rgba(255,255,255,0.38)",
  },

  labelInput: {
    width: "100%",
    minHeight: 44,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    fontSize: 12,
    color: "#ffffff",
  },

  actions: {
    gap: 8,
  },

  secondaryButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  secondaryButtonIcon: {
    fontSize: 14,
  },

  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.78)",
  },

  primaryButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: "#2563eb",
  },

  primaryButtonDisabled: {
    backgroundColor: "rgba(71,85,105,0.55)",
  },

  primaryButtonIcon: {
    fontSize: 14,
  },

  primaryButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },

  liveButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 9,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.18)",
    borderRadius: 12,
    backgroundColor: "rgba(37,99,235,0.10)",
  },

  liveButtonDisabled: {
    opacity: 0.45,
  },

  liveButtonIcon: {
    fontSize: 18,
  },

  liveButtonContent: {
    flex: 1,
  },

  liveButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#60a5fa",
  },

  liveButtonSubtext: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 13,
    color: "rgba(147,197,253,0.52)",
  },

  liveButtonArrow: {
    fontSize: 22,
    fontWeight: "300",
    color: "rgba(147,197,253,0.55)",
  },

  emptyBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 36,
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    color: "#ffffff",
  },

  emptyText: {
    maxWidth: 280,
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    color: "rgba(255,255,255,0.42)",
  },

  retryPrimaryButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#2563eb",
  },

  retryPrimaryButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },

  buttonPressed: {
    opacity: 0.72,
  },
});

export default LocationPicker;
