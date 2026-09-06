// src/features/transport/validators/transport.validator.ts
import { z } from "zod";

export const transportRouteSchema = z.object({
  origin: z.string().min(2, "Lieu de départ requis (minimum 2 caractères)"),
  destination: z
    .string()
    .min(2, "Lieu d'arrivée requis (minimum 2 caractères)"),
  departureTime: z
    .string()
    .min(4, "Veuillez spécifier l'heure de départ (ex: 14:30)"),
  vehicleType: z.enum([
    "voiture",
    "bus",
    "moto",
    "taxi",
    "minibus",
    "camion",
  ] as const),
  seats: z.coerce
    .number()
    .min(1, "Il doit y avoir au moins 1 place disponible"),
  pricePerSeat: z.coerce
    .number()
    .min(0, "Le prix par place doit être un nombre positif"),
  currency: z.string(),
  vehicleModel: z.string().optional().or(z.literal("")),
  vehiclePlate: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export type TransportRouteFormValues = z.infer<typeof transportRouteSchema>;
