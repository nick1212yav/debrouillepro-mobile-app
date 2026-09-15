import { View, Text, Linking, Pressable } from "react-native";

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
      <View style={{ padding: 12, borderRadius: 14, backgroundColor: "#f8fafc", fontSize: 13 }}><Text>Emplacement indisponible</Text></View>
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
    <View style={{ width: "100%", maxWidth: 380, overflow: "hidden", borderRadius: 16, borderColor: "#93c5fd", borderStyle: "solid", backgroundColor: "#fff" }}>{}<View style={{ position: "relative", height: 190, overflow: "hidden", backgroundColor: "#e2e8f0" }}><iframe title={live ? "Position en direct" : "Emplacement partagé"} src={`https://www.openstreetmap.org/export/embed.html?bbox=${
            longitude - 0.005
          }%2C${latitude - 0.005}%2C${longitude + 0.005}%2C${
            latitude + 0.005
          }&layer=mapnik&marker=${latitude}%2C${longitude}`} style={{ width: "100%", height: "100%", borderWidth: 0 }} loading="lazy" /><View style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 22, height: 22, borderRadius: 50, backgroundColor: live ? "#2563eb" : "#ef4444", borderWidth: 3, borderColor: "#fff", borderStyle: "solid", boxShadow: "0 2px 10px rgba(0,0,0,.3)", pointerEvents: "none" }} />{live && (
          <View style={{ position: "absolute", top: 10, left: 10, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999, backgroundColor: active ? "#2563eb" : "#64748b", fontSize: 11, fontWeight: 800 }}>{active ? "● EN DIRECT" : "● TERMINÉ"}</View>
        )}</View>{}<View style={{
          padding: 14,
        }}><View style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}><Text style={{
              fontSize: 20,
            }}>{live ? "📡" : "📍"}</Text><strong style={{ fontSize: 14 }}>{getLocationMessageText(location)}</strong></View>{location.label && (
          <View style={{ marginTop: 6, fontSize: 12 }}>{location.label}</View>
        )}{location.address && (
          <View style={{ marginTop: 4, fontSize: 12 }}>{location.address}</View>
        )}<View style={{ marginTop: 6, fontSize: 10 }}>{latitude.toFixed(6)}{" · "}{longitude.toFixed(6)}{location.accuracy !== undefined && (
            <>
              {" · "}±
              {Math.round(
                liveLocation?.metadata?.accuracy ?? location.accuracy,
              )}
              m
            </>
          )}</View>{}<View style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
          }}><Pressable onPress={openMap} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 10, backgroundColor: "#fff", fontWeight: 700, fontSize: 12 }}>🗺️ Ouvrir la carte
          </Pressable>{live && active && onStopLive && (
            <Pressable onPress={() => void onStopLive(message._id)} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 0, borderRadius: 10, backgroundColor: "#fef2f2", fontWeight: 700, fontSize: 12 }}>
              🛑 Arrêter
            </Pressable>
          )}</View></View></View>
  );
}

export default LocationMessage;
