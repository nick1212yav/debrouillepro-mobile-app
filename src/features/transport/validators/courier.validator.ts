// src/features/transport/validators/courier.validator.ts
import { z } from "zod";

export const courierFormSchema = z.object({
  courierName: z
    .string()
    .min(2, "Nom du coursier requis (minimum 2 caractères)"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  transportMode: z.enum(["moto", "velo", "voiture", "marche"] as const),
  licenseNumber: z.string().optional().or(z.literal("")),
  maxWeightKg: z.coerce
    .number()
    .min(1, "La capacité maximale doit être d'au moins 1 kg"),
  basePrice: z.coerce
    .number()
    .min(0, "Le tarif de prise en charge doit être positif"),
  pricePerKm: z.coerce.number().min(0, "Le tarif par km doit être positif"),
  currency: z.string(),
  operatingZone: z
    .string()
    .min(2, "Zone d'activité requise (ex: Commune de la Gombe)"),
});

export type CourierFormValues = z.infer<typeof courierFormSchema>;
