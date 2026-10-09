// src/features/messages/locations/components/LocationMessage.tsx

import { useCallback } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import type { Id } from "../../../../../convex/_generated/dataModel";

import { useLiveLocation } from "../hooks/useLocation";
import {
  getGoogleMapsUrl,
  getLocationMessageText,
  type LocationMessage as LocationMessageData,
} from "../services/locations.service";

export interface LocationMessageProps {
  message: LocationMessageData;
  onOpenMap?: (latitude: number, longitude: number) => void;
  onStopLive?: (messageId: Id<"messages">) => void | Promise<void>;
}

export function LocationMessage({
  message,
  onOpenMap,
  onStopLive,
}: LocationMessageProps) {
  const location = message.metadata;

  const liveLocation = useLiveLocation(
    location?.mode === "live" ? message._id : undefined,
  );

  const openMap = useCallback(() => {
    if (!location) {
      return;
    }

    const latitude = liveLocation?.metadata?.latitude ?? location.latitude;

    const longitude = liveLocation?.metadata?.longitude ?? location.longitude;

    if (onOpenMap) {
      onOpenMap(latitude, longitude);
      return;
    }

    void Linking.openURL(String(getGoogleMapsUrl(latitude, longitude)));
  }, [
    location,
    liveLocation?.metadata?.latitude,
    liveLocation?.metadata?.longitude,
    onOpenMap,
  ]);

  if (!location) {
    return (
      <View
        style={styles.unavailable}
        accessibilityRole="text"
        accessibilityLabel="Emplacement indisponible"
      >
        <Text style={styles.unavailableIcon}>📍</Text>

        <View style={styles.unavailableContent}>
          <Text style={styles.unavailableTitle}>Emplacement indisponible</Text>

          <Text style={styles.unavailableText}>
            Les informations de localisation ne sont plus disponibles.
          </Text>
        </View>
      </View>
    );
  }

  const live = location.mode === "live";

  const latitude = liveLocation?.metadata?.latitude ?? location.latitude;

  const longitude = liveLocation?.metadata?.longitude ?? location.longitude;

  const accuracy = liveLocation?.metadata?.accuracy ?? location.accuracy;

  const active =
    live && (liveLocation?.metadata?.isActive ?? location.isActive ?? false);

  const locationText = getLocationMessageText(location);

  return (
    <View
      style={styles.container}
      accessibilityLabel={
        live
          ? active
            ? "Position en direct active"
            : "Position en direct terminée"
          : "Position partagée"
      }
    >
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineHorizontalSecondary} />
          <View style={styles.gridLineVertical} />
          <View style={styles.gridLineVerticalSecondary} />
        </View>

        <View style={styles.pinContainer}>
          <View
            style={[
              styles.pinOuter,
              live && active ? styles.pinOuterLive : styles.pinOuterStatic,
            ]}
          >
            <Text style={styles.mapIcon}>{live ? "📡" : "📍"}</Text>
          </View>

          <View style={styles.pinShadow} />
        </View>

        <View style={styles.coordinatesOverlay}>
          <Text style={styles.mapCoords}>
            {latitude.toFixed(6)}
            {" · "}
            {longitude.toFixed(6)}
          </Text>
        </View>

        {live ? (
          <View
            style={[
              styles.liveBadge,
              active ? styles.liveBadgeActive : styles.liveBadgeEnded,
            ]}
          >
            <View
              style={[
                styles.liveBadgeDot,
                active ? styles.liveBadgeDotActive : styles.liveBadgeDotEnded,
              ]}
            />

            <Text style={styles.liveBadgeText}>
              {active ? "EN DIRECT" : "TERMINÉ"}
            </Text>
          </View>
        ) : (
          <View style={styles.staticBadge}>
            <Text style={styles.staticBadgeText}>POSITION</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.titleIconContainer,
              live && active
                ? styles.titleIconContainerLive
                : styles.titleIconContainerStatic,
            ]}
          >
            <Text style={styles.titleIcon}>{live ? "📡" : "📍"}</Text>
          </View>

          <View style={styles.titleContent}>
            <Text style={styles.titleText} numberOfLines={2}>
              {locationText}
            </Text>

            {live ? (
              <Text
                style={[
                  styles.liveStatusText,
                  active ? styles.liveStatusActive : styles.liveStatusEnded,
                ]}
              >
                {active ? "Mise à jour en direct" : "Partage terminé"}
              </Text>
            ) : null}
          </View>
        </View>

        {location.label ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏷️</Text>

            <Text style={styles.label} numberOfLines={2}>
              {location.label}
            </Text>
          </View>
        ) : null}

        {location.address ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🏠</Text>

            <Text style={styles.address} numberOfLines={3}>
              {location.address}
            </Text>
          </View>
        ) : null}

        <View style={styles.coordinatesCard}>
          <View style={styles.coordinatesHeader}>
            <Text style={styles.coordinatesTitle}>Coordonnées</Text>

            {accuracy !== undefined ? (
              <Text style={styles.accuracy}>±{Math.round(accuracy)} m</Text>
            ) : null}
          </View>

          <Text style={styles.coords}>
            {latitude.toFixed(6)}
            {" · "}
            {longitude.toFixed(6)}
          </Text>
        </View>

        <View style={styles.buttonsRow}>
          <Pressable
            onPress={openMap}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir cette position dans la carte"
            style={({ pressed }) => [
              styles.openButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.openButtonIcon}>🗺️</Text>

            <Text style={styles.openButtonText}>Ouvrir la carte</Text>
          </Pressable>

          {live && active && onStopLive ? (
            <Pressable
              onPress={() => void onStopLive(message._id)}
              accessibilityRole="button"
              accessibilityLabel="Arrêter le partage de position"
              style={({ pressed }) => [
                styles.stopButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.stopButtonIcon}>🛑</Text>

              <Text style={styles.stopButtonText}>Arrêter</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  unavailable: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  unavailableIcon: {
    fontSize: 22,
  },

  unavailableContent: {
    flex: 1,
  },

  unavailableTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },

  unavailableText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },

  container: {
    width: "100%",
    maxWidth: 380,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.20)",
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.96)",
  },

  mapPlaceholder: {
    position: "relative",
    height: 190,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#172033",
  },

  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },

  gridLineHorizontal: {
    position: "absolute",
    top: "35%",
    left: -20,
    right: -20,
    height: 1,
    backgroundColor: "#64748b",
    transform: [{ rotate: "-8deg" }],
  },

  gridLineHorizontalSecondary: {
    position: "absolute",
    top: "68%",
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
    left: "35%",
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

  pinContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  pinOuter: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 29,
  },

  pinOuterLive: {
    borderColor: "rgba(96,165,250,0.60)",
    backgroundColor: "rgba(37,99,235,0.32)",
  },

  pinOuterStatic: {
    borderColor: "rgba(148,163,184,0.45)",
    backgroundColor: "rgba(71,85,105,0.45)",
  },

  mapIcon: {
    fontSize: 27,
  },

  pinShadow: {
    width: 22,
    height: 6,
    marginTop: 5,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  coordinatesOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    alignItems: "center",
  },

  mapCoords: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: "hidden",
    borderRadius: 8,
    backgroundColor: "rgba(2,6,23,0.72)",
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
  },

  liveBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 999,
  },

  liveBadgeActive: {
    backgroundColor: "rgba(37,99,235,0.90)",
  },

  liveBadgeEnded: {
    backgroundColor: "rgba(71,85,105,0.90)",
  },

  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  liveBadgeDotActive: {
    backgroundColor: "#86efac",
  },

  liveBadgeDotEnded: {
    backgroundColor: "#cbd5e1",
  },

  liveBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "#ffffff",
  },

  staticBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(30,41,59,0.88)",
  },

  staticBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.78)",
  },

  body: {
    padding: 14,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  titleIconContainer: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  titleIconContainerLive: {
    backgroundColor: "rgba(37,99,235,0.14)",
  },

  titleIconContainerStatic: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  titleIcon: {
    fontSize: 18,
  },

  titleContent: {
    flex: 1,
    minWidth: 0,
  },

  titleText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
    color: "#ffffff",
  },

  liveStatusText: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "600",
  },

  liveStatusActive: {
    color: "#60a5fa",
  },

  liveStatusEnded: {
    color: "rgba(255,255,255,0.40)",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
  },

  infoIcon: {
    width: 18,
    fontSize: 12,
  },

  label: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.64)",
  },

  address: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.50)",
  },

  coordinatesCard: {
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  coordinatesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  coordinatesTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.40)",
  },

  accuracy: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.42)",
  },

  coords: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.68)",
  },

  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  openButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  openButtonIcon: {
    fontSize: 13,
  },

  openButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },

  stopButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.18)",
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  stopButtonIcon: {
    fontSize: 12,
  },

  stopButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f87171",
  },

  buttonPressed: {
    opacity: 0.72,
  },
});

export default LocationMessage;
