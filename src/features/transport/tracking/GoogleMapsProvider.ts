import { View } from "react-native";

// src/features/transport/tracking/GoogleMapsProvider.ts
import type { Coordinates } from "../types";

export class GoogleMapsProvider {
  private static map: any = null;
  private static markers: Record<string, any> = {};
  private static routePolyline: any = null;

  /**
   * Charger et initialiser la carte Google Maps dans un conteneur du DOM [2]
   */
  static initializeMap(
    container: View,
    center: Coordinates,
    zoom = 13,
  ): void {
    if (typeof window === "undefined" || !(window as any).google) {
      console.warn(
        "L'API Google Maps n'est pas chargée globalement sur la fenêtre [2].",
      );
      return;
    }

    const google = (window as any).google;

    // Style de carte sombre haut de gamme (Stripe/Apple style) [2]
    const darkMapStyle = [
      { elementType: "geometry", stylers: [{ color: "#0c0d1e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#0c0d1e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#1a1c38" }],
      },
      {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#050612" }],
      },
    ];

    this.map = new google.maps.Map(container, {
      center: { lat: center.lat, lng: center.lng },
      zoom,
      styles: darkMapStyle,
      disableDefaultUI: true, // Désactiver les contrôles pour l'épuration visuelle
      zoomControl: false,
    });
  }

  /**
   * Dessiner le tracé d'itinéraire en surbrillance violette [2]
   */
  static drawRoute(path: Coordinates[]): void {
    if (!this.map || typeof window === "undefined") return;

    const google = (window as any).google;
    if (!google) return;

    if (this.routePolyline) {
      this.routePolyline.setMap(null); // Nettoyer l'ancienne route
    }

    const googlePath = path.map((p) => new google.maps.LatLng(p.lat, p.lng));

    this.routePolyline = new google.maps.Polyline({
      path: googlePath,
      geodesic: true,
      strokeColor: "#8B5CF6", // Violet DébrouillePro [2]
      strokeOpacity: 0.85,
      strokeWeight: 4,
    });

    this.routePolyline.setMap(this.map);
  }

  /**
   * Mettre à jour la position d'un marqueur en direct [2]
   */
  static updateVehicleMarker(id: string, coords: Coordinates): void {
    if (!this.map || typeof window === "undefined") return;

    const google = (window as any).google;
    if (!google) return;

    const latLng = new google.maps.LatLng(coords.lat, coords.lng);

    if (this.markers[id]) {
      this.markers[id].setPosition(latLng);
    } else {
      this.markers[id] = new google.maps.Marker({
        position: latLng,
        map: this.map,
        title: "Véhicule en direct [2]",
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 4,
          fillColor: "#8B5CF6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1,
        },
      });
    }
  }
}
