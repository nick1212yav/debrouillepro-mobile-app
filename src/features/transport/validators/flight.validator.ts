// src/features/transport/validators/flight.validator.ts
import { z } from "zod";

export const flightFormSchema = z.object({
  airlineName: z.string().min(2, "Nom de la compagnie aérienne requis"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  aircraftModel: z
    .string()
    .min(2, "Modèle de l'aéronef requis (ex: Cessna Caravan, Beechcraft)"),
  flightNumber: z.string().min(1, "Numéro de vol / immatriculation requis"),
  pricePerSeat: z.coerce
    .number()
    .min(0, "Le tarif par siège doit être positif"),
  currency: z.string(),
  seatsAvailable: z.coerce
    .number()
    .min(1, "Il doit y avoir au moins 1 siège disponible"),
  originAirport: z.string().min(2, "Aéroport de départ requis"),
  destinationAirport: z.string().min(2, "Aéroport d'arrivée requis"),
  departureTime: z.string().min(1, "Heure de départ requise"),
  maxLuggageWeightKg: z.coerce
    .number()
    .min(5, "Le poids maximal de bagages doit être d'au moins 5 kg"),
});

export type FlightFormValues = z.infer<typeof flightFormSchema>;
