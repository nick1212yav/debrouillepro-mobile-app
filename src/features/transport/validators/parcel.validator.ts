// src/features/transport/validators/parcel.validator.ts
import { z } from "zod";

export const parcelFormSchema = z.object({
  senderName: z.string().min(2, "Nom de l'expéditeur requis"),
  senderPhone: z.string().min(8, "Téléphone de l'expéditeur requis"),
  recipientName: z.string().min(2, "Nom du destinataire requis"),
  recipientPhone: z.string().min(8, "Téléphone du destinataire requis"),
  origin: z.string().min(2, "Adresse d'expédition requise"),
  destination: z.string().min(2, "Adresse de livraison requise"),
  weightKg: z.coerce.number().min(0.1, "Le poids minimal doit être de 100g"),
  description: z
    .string()
    .min(3, "Description du colis requise (ex: Ordinateur, Documents)"),
  isFragile: z.boolean(),
  insuranceDeclaredValue: z.coerce
    .number()
    .min(0, "La valeur déclarée doit être positive"),
});

export type ParcelFormValues = z.infer<typeof parcelFormSchema>;
