import { Plane } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaBookVoyage: PublicationCTAConfig = {
  label: "Réserver",
  icon: Plane,
  color: "#06B6D4",
  action: "book",
  requiresAuth: true,
  requiresBooking: true,
  requiresPayment: true,
};

export const voyagesConfig: PublicationConfig = {
  type: "voyages",
  label: "Voyages",
  color: "#06B6D4",
  gradient: "from-cyan-500 to-blue-600",
  badge: "Voyages",
  icon: Plane,
  cta: ctaBookVoyage,
  actions: [commonActions.save, commonActions.share],
  detailRoute: "/voyages/:id",
  createRoute: "/voyages/creer",
  placeholder: "Publier une offre de voyage",
  aiCategory: "travel",
  bookingRequired: true,
  paymentSupported: true,
  trackCtaClicks: true,
  trackBookings: true,
};
