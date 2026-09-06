// src/features/transport/validators/bus.validator.ts
import { z } from "zod";

export const busFormSchema = z.object({
  companyName: z.string().min(2, "Nom de la compagnie requis"),
  routeNumber: z.string().min(1, "Numéro ou nom de la ligne requis"),
  origin: z.string().min(2, "Lieu de départ requis"),
  destination: z.string().min(2, "Lieu d'arrivée requis"),
  departureTime: z.string().min(1, "Heure de départ requise"),
  arrivalTime: z.string().optional().or(z.literal("")),
  stops: z.string().optional().or(z.literal("")), // CSV des arrêts
  totalSeats: z.coerce.number().min(10, "Minimum 10 places pour un bus"),
  pricePerSeat: z.coerce.number().min(0, "Le prix du ticket doit être positif"),
  currency: z.string(),
  description: z.string().optional().or(z.literal("")),
  busModel: z.string().optional().or(z.literal("")),
});

export type BusFormValues = z.infer<typeof busFormSchema>;
