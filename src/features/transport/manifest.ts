// src/features/transport/manifest.ts
import { Car } from "lucide-react-native";

export const manifest = {
  id: "transport",
  name: "Mobilité & Transport",
  version: "1.0.0",
  description:
    "Plateforme de covoiturage, taxi, bus et logistique d'Afrique centrale.",
  icon: "Car",
  route: "/transport",
  capabilities: [
    "transport:read",
    "transport:write",
    "transport:book",
    "transport:tracking",
    "transport:admin",
  ],
  features: {
    liveTracking: true,
    splitPayment: true,
    aiRouteOptimization: true,
    multiLanguageSupport: true,
  },
};
