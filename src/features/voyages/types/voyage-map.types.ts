// src/features/voyages/types/voyage-map.types.ts
import type { VoyageTrip } from "./voyage.types";

/**
 * Coordonnées géographiques (latitude, longitude)
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Point sur la carte (pour les itinéraires, les escales)
 */
export interface MapPoint extends Coordinates {
  label: string;
  type: "origin" | "destination" | "stop" | "waypoint";
  time?: string;
}

/**
 * Itinéraire complet (ligne entre les points)
 */
export interface MapRoute {
  points: MapPoint[];
  color: string;
  duration: string;
  distance: number; // en km
  departureTime: string;
  arrivalTime: string;
}

/**
 * État de la carte
 */
export interface VoyageMapState {
  center: Coordinates | null;
  zoom: number;
  route: MapRoute | null;
  isFullscreen: boolean;
  isLoading: boolean;
}

/**
 * Options d'affichage de la carte
 */
export interface VoyageMapOptions {
  showRoute: boolean;
  showStops: boolean;
  showMarkers: boolean;
  interactive: boolean;
}

/**
 * Convertit un voyage en itinéraire cartographique
 * (lorsque les coordonnées seront disponibles)
 */
export interface VoyageMapAdapter {
  from: VoyageTrip;
  to: MapRoute;
}
