// src/features/transport/ai/ChatbotAssistant.ts
import { FareEstimator } from "./FareEstimator";
import { RouteService } from "../services/RouteService";

export interface AssistantResponse {
  answer: string;
  suggestedAction?: "book" | "call" | "route_map";
  payload?: any;
}

export class ChatbotAssistant {
  /**
   * Traiter une question de l'utilisateur relative au transport [2]
   */
  static async processQuery(
    queryText: string,
    currentCity = "Kinshasa",
  ): Promise<AssistantResponse> {
    const q = queryText.toLowerCase();

    // 1. Demande de tarif dynamique [2]
    if (
      q.includes("prix") ||
      q.includes("tarif") ||
      q.includes("coûte") ||
      q.includes("combien")
    ) {
      const isMoto = q.includes("moto") || q.includes("motard");
      const vehicleType = isMoto ? "moto" : "taxi";
      const distance = q.includes("long") || q.includes("loin") ? 15 : 6; // distance simulée

      const estimation = FareEstimator.estimateFare(
        distance,
        vehicleType,
        new Date().getHours(),
        false,
        currentCity,
      );

      return {
        answer: `D'après mes estimations pour un trajet de ${distance} km à ${currentCity} en ${vehicleType === "moto" ? "moto-taxi" : "taxi"}, le prix serait d'environ ${estimation.totalEstimatedFare.toLocaleString()} FCFA (tarif de base : ${estimation.basePrice.toLocaleString()} FCFA) [2].`,
        suggestedAction: "route_map",
        payload: { distance, vehicleType, fare: estimation.totalEstimatedFare },
      };
    }

    // 2. Demande de sécurité ou d'animaux domestiques
    if (
      q.includes("chien") ||
      q.includes("chat") ||
      q.includes("animal") ||
      q.includes("animaux")
    ) {
      return {
        answer:
          "Les animaux de compagnie de petite taille sont acceptés à bord des véhicules de covoiturage s'ils sont placés dans une cage de transport adaptée. Pour les taxis classiques, nous vous conseillons de contacter directement le chauffeur avant votre départ [2].",
        suggestedAction: "call",
      };
    }

    // 3. Demande d'itinéraire le plus rapide
    if (
      q.includes("rapide") ||
      q.includes("embouteillage") ||
      q.includes("bouchon")
    ) {
      return {
        answer:
          "Le moyen de transport le plus rapide pour contourner les embouteillages actuellement est le service Moto-Taxi (Wewa) [2]. L'IA estime un gain de temps moyen de 18 minutes sur les axes saturés de la ville [2].",
        suggestedAction: "book",
        payload: { preferredType: "moto" },
      };
    }

    // Réponse de secours par défaut
    return {
      answer:
        "Bonjour ! Je suis votre assistant Débrouille Transport [2]. Je peux estimer le prix d'une course, trouver le moyen le plus rapide d'éviter les embouteillages ou vérifier si un trajet est adapté pour vos bagages. Que puis-je faire pour vous ? [2]",
    };
  }
}
