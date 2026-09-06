import { Hotel } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaBookHotel: PublicationCTAConfig = {
  label: "Réserver",
  icon: Hotel,
  color: "#8B5CF6",
  action: "book",
  requiresAuth: true,
  requiresBooking: true,
  requiresPayment: true,
};

export const hebergementConfig: PublicationConfig = {
  type: "hebergement",
  label: "Hébergement",
  color: "#8B5CF6",
  gradient: "from-violet-500 to-purple-600",
  badge: "Hébergement",
  icon: Hotel,
  cta: ctaBookHotel,
  actions: [commonActions.save, commonActions.call, commonActions.navigate],
  detailRoute: "/hebergement/:id",
  createRoute: "/hebergement/creer",
  placeholder: "Publier un hébergement",
  aiCategory: "accommodation",
  paymentSupported: true,
  bookingRequired: true,
  trackCtaClicks: true,
  trackBookings: true,
};
