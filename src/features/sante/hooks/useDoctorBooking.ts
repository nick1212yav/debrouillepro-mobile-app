// src/features/sante/hooks/useDoctorBooking.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Appointment } from "../types/appointment.types";
import type { Id } from "@/convex/_generated/dataModel";
import { appointmentSchema } from "../validators/appointment.validator";

export function useDoctorBooking() {
  const mutate = useMutation(api.health.bookAppointment);
  return async (data: {
    professionalId: Id<"medicalProfessionals">;
    slot: string;
    type: "consultation" | "teleconsultation";
    date?: Date;
    notes?: string;
  }) => {
    try {
      const result = await mutate({
        professionalId: data.professionalId,
        slot: data.slot,
        type: data.type,
        date: data.date?.toISOString(),
        notes: data.notes,
      });
      toast.success("Rendez-vous confirmé !");
      return appointmentSchema.parse(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      throw e;
    }
  };
}
