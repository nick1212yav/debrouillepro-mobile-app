export interface DeliveryRouteSpec {
  distanceKm: number;
  preparationTimeMins: number;
  trafficIntensity: "low" | "medium" | "heavy";
  weatherCondition: "clear" | "rainy" | "stormy";
  vehicleType: "moto" | "bicycle" | "car";
}

export class DeliveryTimePredictor {
  /**
   * Prédit le délai de livraison global (de la validation de commande à la remise en main propre)
   */
  public static predictETA(route: DeliveryRouteSpec): {
    minMinutes: number;
    maxMinutes: number;
    variablesImpact: string[];
  } {
    let baseTravelSpeedKmh = 30; // Vitesse de croisière standard en ville africaine en moto
    const impacts: string[] = [];

    // Ajustement de la vitesse de croisière selon le véhicule
    if (route.vehicleType === "bicycle") {
      baseTravelSpeedKmh = 12;
    } else if (route.vehicleType === "car") {
      baseTravelSpeedKmh = 22; // Souvent ralentie par les encombrements urbains
    }

    // Impact du trafic routier
    let trafficMultiplier = 1.0;
    if (route.trafficIntensity === "medium") {
      trafficMultiplier = 1.25;
      impacts.push("Ralentissement routier modéré");
    } else if (route.trafficIntensity === "heavy") {
      trafficMultiplier = 1.7;
      impacts.push("Congestion majeure observée sur l'itinéraire");
    }

    // Impact météorologique
    let weatherMultiplier = 1.0;
    if (route.weatherCondition === "rainy") {
      weatherMultiplier = 1.3;
      impacts.push("Ralentissement préventif sous pluie");
    } else if (route.weatherCondition === "stormy") {
      weatherMultiplier = 1.65;
      impacts.push("Conditions orageuses - vitesse réduite pour sécurité");
    }

    // Calcul du temps de trajet net
    const travelTimeHours = route.distanceKm / baseTravelSpeedKmh;
    let travelTimeMins = travelTimeHours * 60;

    // Application des coefficients multiplicateurs
    travelTimeMins = travelTimeMins * trafficMultiplier * weatherMultiplier;

    // Le délai global comprend le temps de préparation en cuisine + le temps de route
    const calculatedETA = route.preparationTimeMins + travelTimeMins;

    // Marge de tolérance de 5 à 10 minutes pour éviter la frustration de l'utilisateur
    const minMinutes = Math.max(15, Math.round(calculatedETA - 3));
    const maxMinutes = Math.max(20, Math.round(calculatedETA + 6));

    return {
      minMinutes,
      maxMinutes,
      variablesImpact:
        impacts.length > 0 ? impacts : ["Conditions de circulation optimales"],
    };
  }
}
