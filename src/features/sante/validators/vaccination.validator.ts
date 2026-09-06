import { z } from "zod";

export const vaccinationSchema = z.object({
  name: z.string().min(1, "Nom du vaccin requis"),
  status: z
    .enum(["pending", "completed", "overdue"] as const)
    .default("completed"),
  date: z.string().min(1, "Date requise"),
  patientId: z.string().min(1, "Patient requis"),
  location: z.string().optional(),
  nextDose: z.string().optional(),
  administeredBy: z.string().optional(),
  batchNumber: z.string().optional(),
  sideEffects: z.string().optional(),
});

export type VaccinationFormValues = z.infer<typeof vaccinationSchema>;
