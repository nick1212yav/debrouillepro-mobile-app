// src/features/sante/actions.ts
import type { ActionConfig } from "@/core/sdk/types/action.types";
import { toast } from "sonner";
import { Linking } from "react-native";

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
      if (context.id) Linking.openURL(`/sante/${context.id}`);
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
        toast.error("doctorId, slot, type et patientId sont requis");
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
      Linking.openURL(`/sante/appointment?${params.toString()}`);
    },
  },
  {
    id: "sante.viewHospital",
    label: "Voir l'hôpital",
    icon: "🏥",
    permission: "hospital:view",
    execute: async (context) => {
      if (context.id) Linking.openURL(`/sante/hospital/${context.id}`);
    },
  },
  {
    id: "sante.viewPharmacy",
    label: "Voir la pharmacie",
    icon: "💊",
    permission: "pharmacy:view",
    execute: async (context) => {
      if (context.id) Linking.openURL(`/sante/pharmacy/${context.id}`);
    },
  },
  {
    id: "sante.viewLaboratory",
    label: "Voir le laboratoire",
    icon: "🧪",
    permission: "laboratory:view",
    execute: async (context) => {
      if (context.id) Linking.openURL(`/sante/laboratory/${context.id}`);
    },
  },
  {
    id: "sante.callEmergency",
    label: "Appeler les secours",
    icon: "🚑",
    permission: "emergency:call",
    execute: async (context) => {
      if (context.number) Linking.openURL(`tel:${context.number}`);
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
        Linking.openURL(`/sante/telemedicine?appointmentId=${context.appointmentId}`);
      }
    },
  },
  {
    id: "sante.viewMedicalRecords",
    label: "Consulter le dossier médical",
    icon: "📂",
    permission: "medicalRecords:view",
    execute: async () => {
      Linking.openURL("/sante/records");
    },
  },
  {
    id: "sante.downloadPrescription",
    label: "Télécharger l'ordonnance",
    icon: "📄",
    permission: "prescription:download",
    execute: async (context) => {
      if (context.prescriptionId) {
        toast.info("Téléchargement de l'ordonnance...");
        // Dans le futur, on pourra appeler une API pour générer un PDF
        // Pour l'instant, on simule un téléchargement
        Linking.openURL(String(`/api/prescriptions/${context.prescriptionId}/download`));
      }
    },
  },
];
