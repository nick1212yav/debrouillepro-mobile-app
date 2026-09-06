import { Scale } from "lucide-react-native";
import type { PublicationConfig } from "../../types";
import { commonActions, ctaView } from "../common.config";

export const justiceConfig: PublicationConfig = {
  type: "justice",
  label: "Justice",
  color: "#EF4444",
  gradient: "from-red-500 to-rose-600",
  badge: "Justice",
  icon: Scale,
  cta: { ...ctaView, label: "Consulter" },
  actions: [commonActions.save, commonActions.share],
  detailRoute: "/justice/:id",
  createRoute: "/justice/creer",
  placeholder: "Publier un cas juridique",
  aiCategory: "legal",
};
