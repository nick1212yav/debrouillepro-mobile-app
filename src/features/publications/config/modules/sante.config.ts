import { Stethoscope } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaBookAppointment: PublicationCTAConfig = {
  label: "Prendre RDV",
  icon: Stethoscope,
  color: "#EF4444",
  action: "book",
  requiresAuth: true,
  requiresBooking: true,
};

export const santeConfig: PublicationConfig = {
  type: "sante",
  label: "Santé",
  color: "#EF4444",
  gradient: "from-red-500 to-rose-600",
  badge: "Santé",
  icon: Stethoscope,
  cta: ctaBookAppointment,
  actions: [commonActions.save, commonActions.call, commonActions.contact],
  detailRoute: "/sante/:id",
  createRoute: "/sante/creer",
  placeholder: "Publier un service de santé",
  aiCategory: "healthcare",
  bookingRequired: true,
  trackCtaClicks: true,
  trackBookings: true,
};
