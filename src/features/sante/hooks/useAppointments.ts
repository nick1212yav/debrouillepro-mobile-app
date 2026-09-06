// src/features/sante/hooks/useAppointments.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Appointment } from "../types/appointment.types";

export function useAppointments(
  patientId?: Id<"users">,
  doctorId?: Id<"medicalProfessionals">,
) {
  const appointments = useQuery(
    api.health.getAppointments,
    patientId || doctorId ? { patientId, doctorId } : "skip",
  );
  return {
    appointments: appointments as Appointment[] | null | undefined,
    isLoading: appointments === undefined,
  };
}
