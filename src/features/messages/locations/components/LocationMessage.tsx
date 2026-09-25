import { View, Text, Linking, Pressable, StyleSheet } from "react-native";

// src/features/messages/locations/components/LocationMessage.tsx

import type { Id } from "../../../../../convex/_generated/dataModel";

import {
  getGoogleMapsUrl,
  getLocationMessageText,
  type LocationMessage as LocationMessageData,
} from "../services/locations.service";

import { useLiveLocation } from "../hooks/useLocation";

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

  if (!location) {
    return (
      <View style={styles.unavailable}>
        <Text style={styles.unavailableText}>Emplacement indisponible</Text>
      </View>
    );
  }

  const live = location.mode === "live";
  const latitude = liveLocation?.metadata?.latitude ?? location.latitude;
  const longitude = liveLocation?.metadata?.longitude ?? location.longitude;
  const active =
    live && (liveLocation?.metadata?.isActive ?? location.isActive ?? false);

  const openMap = () => {
    if (onOpenMap) {
      onOpenMap(latitude, longitude);
      return;
    }
    Linking.openURL(String(getGoogleMapsUrl(latitude, longitude)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>📍</Text>
        <Text style={styles.mapCoords}>
          {latitude.toFixed(6)} · {longitude.toFixed(6)}
        </Text>
        {live && (
          <View style={[styles.liveBadge, active ? styles.liveBadgeActive : styles.liveBadgeEnded]}>
            <Text style={styles.liveBadgeText}>
              {active ? "● EN DIRECT" : "● TERMINÉ"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.titleIcon}>{live ? "📡" : "📍"}</Text>
          <Text style={styles.titleText}>
            {getLocationMessageText(location)}
          </Text>
        </View>

        {location.label && (
          <Text style={styles.label}>{location.label}</Text>
        )}
        {location.address && (
          <Text style={styles.address}>{location.address}</Text>
        )}
        <Text style={styles.coords}>
          {latitude.toFixed(6)}{" · "}{longitude.toFixed(6)}
          {location.accuracy !== undefined && (
            <>{" · ±"}{Math.round(liveLocation?.metadata?.accuracy ?? location.accuracy)}m</>
          )}
        </Text>

        <View style={styles.buttonsRow}>
          <Pressable onPress={openMap} style={styles.openButton}>
            <Text style={styles.openButtonText}>🗺️ Ouvrir la carte</Text>
          </Pressable>
          {live && active && onStopLive && (
            <Pressable
              onPress={() => void onStopLive(message._id)}
              style={styles.stopButton}
            >
              <Text style={styles.stopButtonText}>🛑 Arrêter</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  unavailable: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
  },
  unavailableText: {
    fontSize: 13,
    color: "#4b5563",
  },
  container: {
    width: "100%",
    maxWidth: 380,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#fff",
  },
  mapPlaceholder: {
    height: 190,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  mapIcon: {
    fontSize: 36,
    marginBottom: 6,
  },
  mapCoords: {
    fontSize: 11,
    color: "#4b5563",
  },
  liveBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  liveBadgeActive: {
    backgroundColor: "#2563eb",
  },
  liveBadgeEnded: {
    backgroundColor: "#64748b",
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
  body: {
    padding: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleIcon: {
    fontSize: 20,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: "#4b5563",
  },
  address: {
    marginTop: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  coords: {
    marginTop: 6,
    fontSize: 10,
    color: "#6b7280",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  openButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  openButtonText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#111827",
  },
  stopButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    alignItems: "center",
  },
  stopButtonText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#b91c1c",
  },
});

export default LocationMessage;