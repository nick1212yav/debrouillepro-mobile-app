import { Car } from "lucide-react-native";
import type { PublicationConfig, PublicationCTAConfig } from "../../types";
import { commonActions } from "../common.config";

const ctaBook: PublicationCTAConfig = {
  label: "Réserver",
  icon: Car,
  color: "#3B82F6",
  action: "book",
  requiresAuth: true,
  requiresBooking: true,
};

export const transportConfig: PublicationConfig = {
  type: "transport",
  label: "Transport",
  color: "#3B82F6",
  gradient: "from-blue-500 to-cyan-600",
  badge: "Transport",
  icon: Car,
  cta: ctaBook,
  actions: [commonActions.save, commonActions.share],
  detailRoute: "/transport/:id",
  createRoute: "/transport/creer",
  placeholder: "Publier un transport",
  aiCategory: "transportation",
  bookingRequired: true,
  trackCtaClicks: true,
  trackBookings: true,
};
