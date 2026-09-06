import { z } from "zod";

export const appointmentSchema = z.object({
  type: z.enum([
    "consultation",
    "teleconsultation",
    "emergency",
    "follow-up",
  ] as const),
  date: z.string().min(1, "Date requise"),
  durationMinutes: z.number().positive().default(30),
  reminder: z.boolean().default(true),
  patientId: z.string().min(1, "Patient requis"),
  doctorId: z.string().min(1, "Médecin requis"),
  slot: z.string().min(1, "Créneau requis"),
  notes: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const appointmentStatusSchema = z.enum([
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no-show",
  "rescheduled",
] as const);
export const appointmentStatsSchema = z.object({
  total: z.number(),
  completed: z.number(),
  cancelled: z.number(),
  noShow: z.number(),
  rescheduled: z.number(),
  averageDuration: z.number(),
  averageLeadTime: z.number(),
  conversionRate: z.number(),
  teleconsultationRate: z.number(),
  mostBookedSpecialty: z.string(),
});
