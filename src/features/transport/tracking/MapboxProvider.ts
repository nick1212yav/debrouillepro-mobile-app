import { View } from "react-native";

// src/features/transport/tracking/MapboxProvider.ts
import type { Coordinates } from "../types";

export class MapboxProvider {
  private static map: any = null;
  private static marker: any = null;

  /**
   * Initialiser une instance de carte Mapbox GL JS [2]
   */
  static initializeMap(
    container: View,
    center: Coordinates,
    accessToken: string,
    zoom = 12,
  ): void {
    if (typeof window === "undefined" || !(window as any).mapboxgl) {
      console.warn(
        "L'API Mapbox GL JS n'est pas chargée globalement sur la fenêtre [2].",
      );
      return;
    }

    const mapboxgl = (window as any).mapboxgl;
    mapboxgl.accessToken = accessToken;

    this.map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/dark-v11", // Thème sombre natif de Mapbox [2]
      center: [center.lng, center.lat],
      zoom,
      interactive: false, // Plus stable dans les fiches détails défilantes
    });
  }

  /**
   * Dessiner un tracé de ligne vectoriel Mapbox
   */
  static drawRoute(coordinates: Coordinates[]): void {
    if (!this.map) return;

    const mapboxGeoJSON = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinates.map((c) => [c.lng, c.lat]),
      },
    };

    if (this.map.getSource("route")) {
      this.map.getSource("route").setData(mapboxGeoJSON);
    } else {
      this.map.addSource("route", {
        type: "geojson",
        data: mapboxGeoJSON,
      });

      this.map.addLayer({
        id: "route-layer",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#8B5CF6", // Violet DébrouillePro [2]
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
    }
  }

  /**
   * Mettre à jour le marqueur GPS de position véhicule [2]
   */
  static updateMarker(coords: Coordinates): void {
    if (!this.map || typeof window === "undefined") return;

    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    const coordinates: [number, number] = [coords.lng, coords.lat];

    if (this.marker) {
      this.marker.setLngLat(coordinates);
    } else {
      // Création d'un élément d'icône personnalisé stylisé
      const el = document.createElement("div");
      el.className = "custom-vehicle-marker";
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#8B5CF6";
      el.style.border = "2px solid #ffffff";
      el.style.boxShadow = "0 0 10px rgba(139, 92, 246, 0.6)";

      this.marker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .addTo(this.map);
    }

    this.map.easeTo({ center: coordinates, duration: 800 });
  }
}
