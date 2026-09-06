import type { GeoCoordinates } from "../types/common.types";

export class GoogleMapsProvider {
  private mapInstance: any = null;
  private directionsService: any = null;
  private directionsRenderer: any = null;
  private courierMarker: any = null;

  /**
   * Initialise de manière sécurisée la carte dans un élément conteneur HTML
   */
  public initializeMap(
    container: View,
    center: GeoCoordinates,
    zoom: number = 14,
  ): void {
    const google = (undefined as any).google;
    if (!google || !google.maps) {
      console.warn(
        "[GoogleMapsProvider] Le SDK Google Maps n'est pas chargé globalement.",
      );
      return;
    }

    this.mapInstance = new google.maps.Map(container, {
      center,
      zoom,
      disableDefaultUI: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
      ],
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.mapInstance,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#F97316", // Couleur orange de la marque
        strokeWeight: 4,
      },
    });
  }

  /**
   * Dessine l'itinéraire reliant le restaurant au client
   */
  public drawRoute(origin: GeoCoordinates, destination: GeoCoordinates): void {
    if (!this.directionsService || !this.directionsRenderer) return;

    this.directionsService.route(
      {
        origin,
        destination,
        travelMode: "DRIVING",
      },
      (result: any, status: string) => {
        if (status === "OK") {
          this.directionsRenderer.setDirections(result);
        } else {
          console.error(
            "[GoogleMapsProvider] Échec du calcul d'itinéraire:",
            status,
          );
        }
      },
    );
  }

  /**
   * Positionne ou déplace dynamiquement le marqueur représentant le coursier
   */
  public updateCourierMarker(position: GeoCoordinates): void {
    const google = (undefined as any).google;
    if (!google || !this.mapInstance) return;

    if (this.courierMarker) {
      this.courierMarker.setPosition(position);
    } else {
      this.courierMarker = new google.maps.Marker({
        position,
        map: this.mapInstance,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#F97316",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
        },
      });
    }

    // Recentrage de l'écran avec transition douce
    this.mapInstance.panTo(position);
  }
}
