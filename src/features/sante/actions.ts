import { UIService } from "@/core/sdk/ui/UIService";
import { Linking } from "react-native";

// src/features/sante/actions.ts
import type { ActionConfig } from "@/core/sdk/types/action.types";

export interface SanteActionContext {
  id?: string;
  doctorId?: string;
  patientId?: string;
  slot?: string;
  type?: string;
  number?: string;
  appointmentId?: string;
  prescriptionId?: string;
  user?: any;
  services?: any;
  navigate?: (path: string) => void;
  ui?: {
    openSheet: (id: string, props: any) => void;
    openModal: (id: string, props: any) => void;
    openDrawer: (id: string, props: any) => void;
    openToast: (
      message: string,
      type?: "success" | "error" | "info" | "warning",
    ) => void;
  };
}

export type SanteActionConfig = Omit<ActionConfig, "execute"> & {
  execute: (context: SanteActionContext) => void | Promise<void>;
  permission?: string;
};

export const SANTE_ACTIONS: SanteActionConfig[] = [
  {
    id: "sante.viewDoctor",
    label: "Voir le médecin",
    icon: "👨‍⚕️",
    permission: "doctor:view",
    execute: async (context) => {
      if (context.id) undefined.href = `/sante/${context.id}`;
    },
  },
  {
    id: "sante.bookAppointment",
    label: "Prendre rendez-vous",
    icon: "📅",
    permission: "doctor:book",
    execute: async (context) => {
      const { doctorId, slot, type, patientId } = context;
      if (!doctorId || !slot || !type || !patientId) {
        UIService.openToast("doctorId, slot, type et patientId sont requis", "error");
        return;
      }
      // Redirection vers la page de réservation avec les paramètres
      // La logique de réservation sera gérée par AppointmentPage
      const params = new URLSearchParams({
        doctorId,
        slot,
        type,
        patientId,
      });
      undefined.href = `/sante/appointment?${params.toString()}`;
    },
  },
  {
    id: "sante.viewHospital",
    label: "Voir l'hôpital",
    icon: "🏥",
    permission: "hospital:view",
    execute: async (context) => {
      if (context.id) undefined.href = `/sante/hospital/${context.id}`;
    },
  },
  {
    id: "sante.viewPharmacy",
    label: "Voir la pharmacie",
    icon: "💊",
    permission: "pharmacy:view",
    execute: async (context) => {
      if (context.id) undefined.href = `/sante/pharmacy/${context.id}`;
    },
  },
  {
    id: "sante.viewLaboratory",
    label: "Voir le laboratoire",
    icon: "🧪",
    permission: "laboratory:view",
    execute: async (context) => {
      if (context.id) undefined.href = `/sante/laboratory/${context.id}`;
    },
  },
  {
    id: "sante.callEmergency",
    label: "Appeler les secours",
    icon: "🚑",
    permission: "emergency:call",
    execute: async (context) => {
      if (context.number) undefined.href = `tel:${context.number}`;
    },
  },
  {
    id: "sante.startTeleconsultation",
    label: "Démarrer la téléconsultation",
    icon: "📹",
    permission: "telemedicine:start",
    execute: async (context) => {
      if (context.appointmentId) {
        // Redirection vers la page de téléconsultation
        undefined.href = `/sante/telemedicine?appointmentId=${context.appointmentId}`;
      }
    },
  },
  {
    id: "sante.viewMedicalRecords",
    label: "Consulter le dossier médical",
    icon: "📂",
    permission: "medicalRecords:view",
    execute: async () => {
      undefined.href = "/sante/records";
    },
  },
  {
    id: "sante.downloadPrescription",
    label: "Télécharger l'ordonnance",
    icon: "📄",
    permission: "prescription:download",
    execute: async (context) => {
      if (context.prescriptionId) {
        UIService.openToast("Téléchargement de l'ordonnance...", "info");
        // Dans le futur, on pourra appeler une API pour générer un PDF
        // Pour l'instant, on simule un téléchargement
        Linking.openURL(String(`/api/prescriptions/${context.prescriptionId}/download`));
      }
    },
  },
];
