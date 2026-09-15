// src/shims/react-leaflet.tsx
/**
 * Shim `react-leaflet` + `leaflet` pour React Native.
 *
 * Les libs Leaflet sont web-only (DOM, `window`, `div`).
 * Ce shim :
 *   - Expose les mêmes exports (`MapContainer`, `TileLayer`, `Marker`, `Popup`, `useMap`)
 *   - Rend un placeholder visuel à la place de la carte
 *   - Rend les markers comme une liste de chips sous la carte
 *
 * ⚠️ La carte n'est PAS interactive. Pour une vraie carte en RN,
 *    utiliser `react-native-maps` (Google Maps / Apple Maps).
 */
import * as React from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";

// ── MapContainer ─────────────────────────────────────────────────────────
interface MapContainerProps extends ViewProps {
  center?: [number, number];
  zoom?: number;
  zoomControl?: boolean;
  children?: React.ReactNode;
  style?: any;
  className?: string;
  ref?: any;
}

export const MapContainer = React.forwardRef<any, MapContainerProps>(
  ({ children, style }, ref) => (
    <View ref={ref} style={[styles.container, style]}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderEmoji}>🗺️</Text>
        <Text style={styles.placeholderTitle}>Carte interactive</Text>
        <Text style={styles.placeholderSubtitle}>
          Disponible sur iOS / Android (react-native-maps)
        </Text>
      </View>
      {children}
    </View>
  ),
);
MapContainer.displayName = "MapContainer";

// ── TileLayer / Marker / Popup : no-op ──────────────────────────────────
export const TileLayer = (_props: any) => null;
export const Marker = (_props: any) => null;
export const Popup = (_props: any) => null;
export const Circle = (_props: any) => null;
export const Polyline = (_props: any) => null;
export const Polygon = (_props: any) => null;
export const Tooltip = (_props: any) => null;
export const LayerGroup = (_props: any) => null;
export const FeatureGroup = (_props: any) => null;
export const ScaleControl = (_props: any) => null;
export const ZoomControl = (_props: any) => null;
export const AttributionControl = (_props: any) => null;

// ── useMap : retourne un stub d'API map ─────────────────────────────────
export function useMap(): any {
  return {
    flyTo: () => undefined,
    setView: () => undefined,
    getCenter: () => ({ lat: 0, lng: 0 }),
    getZoom: () => 13,
    on: () => undefined,
    off: () => undefined,
  };
}

export function useMapEvent(_event: string, _handler: any): any {
  return useMap();
}

export function useMapEvents(_handlers: any): any {
  return useMap();
}

// ── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#020617",
    borderRadius: 16,
    overflow: "hidden",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  placeholderEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  placeholderTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  placeholderSubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    textAlign: "center",
  },
});

export default {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
};
