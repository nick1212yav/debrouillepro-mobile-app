import { z } from "zod";

export const prescriptionSchema = z.object({
  status: z
    .enum(["active", "cancelled", "expired", "dispensed"] as const)
    .default("active"),
  date: z.string().min(1, "Date requise"),
  patientId: z.string().min(1, "Patient requis"),
  doctorId: z.string().min(1, "Médecin requis"),
  medications: z
    .array(
      z.object({
        name: z.string().min(1, "Nom requis"),
        duration: z.string().min(1, "Durée requise"),
        dosage: z.string().min(1, "Dosage requis"),
        frequency: z.string().min(1, "Fréquence requise"),
      }),
    )
    .min(1, "Au moins un médicament requis"),
  validUntil: z.string().min(1, "Date de validité requise"),
  refills: z.number().default(0),
  notes: z.string().optional(),
});

export type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;
