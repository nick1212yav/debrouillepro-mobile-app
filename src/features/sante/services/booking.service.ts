import { UIService } from "@/core/sdk/ui/UIService";

// src/features/sante/services/booking.service.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { AppointmentType } from "../types/appointment.types";
import { appointmentSchema } from "../validators/appointment.validator";

export interface BookAppointmentData {
  professionalId: Id<"medicalProfessionals">;
  slot: string;
  type: AppointmentType;
  date?: Date;
  notes?: string;
}

// Fonction utilitaire pour mapper les types d'appointment vers les types acceptés par Convex
const mapAppointmentType = (
  type: AppointmentType,
): "consultation" | "teleconsultation" => {
  // Convex n'accepte que "consultation" ou "teleconsultation"
  // On mappe les autres types vers "consultation"
  if (type === "emergency" || type === "follow-up" || type === "consultation") {
    return "consultation";
  }
  if (type === "teleconsultation") {
    return "teleconsultation";
  }
  return "consultation"; // fallback
};

// Hook pour réserver un rendez-vous
export function useBookAppointment() {
  const mutate = useMutation(api.health.bookAppointment);
  return async (data: BookAppointmentData) => {
    try {
      const result = await mutate({
        professionalId: data.professionalId,
        slot: data.slot,
        type: mapAppointmentType(data.type),
        date: data.date?.toISOString(),
        notes: data.notes,
      });
      UIService.openToast("Rendez-vous confirmé !", "success");
      return appointmentSchema.parse(result);
    } catch (e) {
      UIService.openToast(e instanceof Error ? e.message : "Erreur", "error");
      throw e;
    }
  };
}

// Hook pour annuler un rendez-vous
export function useCancelAppointment() {
  const mutate = useMutation(api.health.cancelAppointment);
  return async (id: Id<"medicalAppointments">) => {
    try {
      await mutate({ id });
      UIService.openToast("Annulé", "success");
    } catch (e) {
      UIService.openToast(e instanceof Error ? e.message : "Erreur", "error");
      throw e;
    }
  };
}

// Hook pour obtenir la disponibilité d'un médecin
export function useAvailability(
  professionalId: Id<"medicalProfessionals"> | null,
  date?: Date,
) {
  return useQuery(
    api.health.getAvailability,
    professionalId ? { professionalId, date: date?.toISOString() } : "skip",
  );
}

// Fonction exportée pour actions.ts
// Cette fonction peut être utilisée pour réserver un rendez-vous depuis une action
export async function bookAppointment(data: {
  professionalId: string;
  slot: string;
  type: string;
  patientId: string;
}) {
  // Cette fonction utilise le client Convex directement.
  // Elle est conçue pour être appelée depuis actions.ts.
  // Note : l'implémentation réelle devrait utiliser le client Convex.
  // Pour l'instant, nous renvoyons une erreur claire pour le développement.
  throw new Error(
    "bookAppointment: Cette fonction doit être appelée avec un client Convex. Utilisez useBookAppointment dans un composant React.",
  );
}
