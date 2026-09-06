import type { DeliveryRouteSpec } from "../types/delivery.types";

export class ETACalculator {
  /**
   * Calcule le délai estimé en minutes
   */
  public static calculateMins(spec: DeliveryRouteSpec): number {
    // Vitesse par défaut du coursier en moto en milieu urbain africain
    let speedKmh = 25;

    if (spec.vehicleType === "car") {
      speedKmh = 18; // Contraint par les embouteillages
    } else if (spec.vehicleType === "bicycle") {
      speedKmh = 12;
    }

    // Calcul du temps de déplacement brut
    let travelTimeHrs = spec.distanceKm / speedKmh;
    let travelTimeMins = travelTimeHrs * 60;

    // Ajustement de friction du trafic routier
    switch (spec.trafficIntensity) {
      case "medium":
        travelTimeMins *= 1.25;
        break;
      case "heavy":
        travelTimeMins *= 1.6;
        break;
    }

    // Ajustement de friction de la météo
    switch (spec.weatherCondition) {
      case "rainy":
        travelTimeMins *= 1.3;
        break;
      case "stormy":
        travelTimeMins *= 1.8;
        break;
    }

    // Le temps total inclut la préparation + le transport ajusté
    const overallTime = spec.preparationTimeMins + travelTimeMins;

    return Math.max(5, Math.round(overallTime));
  }

  /**
   * Renvoie l'heure de livraison estimée formatée (ex: "13:45")
   */
  public static getArrivalClockTime(minutesRemaining: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutesRemaining);

    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");

    return `${hh}:${mm}`;
  }
}
