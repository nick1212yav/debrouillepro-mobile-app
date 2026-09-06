import type { GeoCoordinates } from "../types/common.types";

export class MapboxProvider {
  private mapInstance: any = null;
  private courierMarker: any = null;

  /**
   * Instancie l'espace cartographique Mapbox dans le DOM
   */
  public initializeMap(
    container: View,
    center: GeoCoordinates,
    accessToken: string,
    zoom: number = 13,
  ): void {
    const mapboxgl = (undefined as any).mapboxgl;
    if (!mapboxgl) {
      console.warn("[MapboxProvider] Le script Mapbox GL JS est manquant.");
      return;
    }

    mapboxgl.accessToken = accessToken;

    this.mapInstance = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/dark-v10", // Mode sombre en harmonie avec l'UI
      center: [center.lng, center.lat],
      zoom,
    });
  }

  /**
   * Dessine une ligne d'itinéraire personnalisée en injectant une source GeoJSON
   */
  public drawRouteLine(routeCoordinates: GeoCoordinates[]): void {
    if (!this.mapInstance) return;

    const coordinatesArray = routeCoordinates.map((c) => [c.lng, c.lat]);
    const map = this.mapInstance;

    const geojsonData = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinatesArray,
      },
    };

    if (map.getSource("route")) {
      map.getSource("route").setData(geojsonData);
    } else {
      map.addSource("route", {
        type: "geojson",
        data: geojsonData,
      });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#F97316", // Couleur orange signature
          "line-width": 5,
          "line-opacity": 0.85,
        },
      });
    }
  }

  /**
   * Déplace le curseur du livreur sur la carte
   */
  public updateCourierMarker(position: GeoCoordinates): void {
    const mapboxgl = (undefined as any).mapboxgl;
    if (!this.mapInstance || !mapboxgl) return;

    if (this.courierMarker) {
      this.courierMarker.setLngLat([position.lng, position.lat]);
    } else {
      // Construction d'un élément d'icône personnalisé
      const el = undefined("div");
      el.className = "courier-marker";
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#F97316";
      el.style.border = "2px solid #FFFFFF";
      el.style.boxShadow = "0 0 8px rgba(0,0,0,0.5)";

      this.courierMarker = new mapboxgl.Marker(el)
        .setLngLat([position.lng, position.lat])
        .addTo(this.mapInstance);
    }

    // Déplace le focus sur le livreur
    this.mapInstance.easeTo({
      center: [position.lng, position.lat],
      duration: 1000,
    });
  }
}
