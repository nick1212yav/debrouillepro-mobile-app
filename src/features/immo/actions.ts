import type { ActionConfig } from "@/core/sdk/types";
import { Linking, Share } from "react-native";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface ImmoMeta {
  propertyId?: string;
  status?: string;
  phone?: string;
}

/**
 * Parse le champ `meta` d'une publication immobilière.
 * Supporte à la fois les chaînes JSON et les objets.
 */
function parseImmoMeta(rawMeta: any): ImmoMeta {
  if (!rawMeta) return {};
  if (typeof rawMeta === "string") {
    try {
      return JSON.parse(rawMeta) as ImmoMeta;
    } catch {
      return {};
    }
  }
  return rawMeta as ImmoMeta;
}

export const actions: ActionConfig[] = [
  // ─── Voir le bien ────────────────────────────────────────────
  {
    id: "immo.view",
    label: "Voir le bien",
    icon: "👁️",
    variant: "default",
    order: 0,
    execute: async (context) => {
      const meta = parseImmoMeta(context.publication.meta);
      const propertyId = meta.propertyId;

      // ✅ Navigation directe vers /immo/:propertyId
      // ❌ Pas de fallback vers publication._id (car c'est un Id<"publications">)
      if (!propertyId) {
        console.error(
          "❌ Publication immobilière sans propertyId :",
          context.publication._id,
        );
        throw new Error(
          "Cette annonce immobilière n'est pas correctement liée à un bien. Contactez le support.",
        );
      }

      context.navigate(`/immo/${propertyId}`);
    },
  },

  // ─── Contacter ────────────────────────────────────────────────
  {
    id: "immo.contact",
    label: "Contacter",
    icon: "💬",
    variant: "outline",
    order: 1,
    execute: async (context) => {
      context.ui.openSheet("immo.contact", {
        publication: context.publication,
      });
    },
  },

  // ─── Sauvegarder ──────────────────────────────────────────────
  {
    id: "immo.save",
    label: "Sauvegarder",
    icon: "❤️",
    variant: "ghost",
    order: 2,
    execute: async (context) => {
      context.ui.openToast("Bien sauvegardé", "success");
    },
  },

  // ─── Partager ──────────────────────────────────────────────────
  {
    id: "immo.share",
    label: "Partager",
    icon: "📤",
    variant: "ghost",
    order: 3,
    execute: async (context) => {
      if (navigator.share) {
        await Share.share({ message: String(context.publication.description) + "\n" + "\n" + String(window.location.href), title: context.publication.title });
      } else {
        await Clipboard.setString(window.location.href);
        context.ui.openToast("Lien copié !", "success");
      }
    },
  },

  // ─── Demander une visite ──────────────────────────────────────
  {
    id: "immo.visit",
    label: "Demander une visite",
    icon: "📅",
    variant: "default",
    order: 4,
    visible: (context) => {
      const meta = parseImmoMeta(context.publication.meta);
      return meta.status === "available";
    },
    enabled: (context) => !!context.user,
    execute: async (context) => {
      context.ui.openSheet("immo.visit", {
        publication: context.publication,
      });
    },
  },

  // ─── Appeler ────────────────────────────────────────────────────
  {
    id: "immo.call",
    label: "Appeler",
    icon: "📞",
    variant: "outline",
    order: 5,
    visible: (context) => {
      const meta = parseImmoMeta(context.publication.meta);
      return !!meta.phone;
    },
    execute: async (context) => {
      const meta = parseImmoMeta(context.publication.meta);
      if (meta.phone) {
        Linking.openURL(`tel:${meta.phone}`);
      }
    },
  },

  // ─── WhatsApp ──────────────────────────────────────────────────
  {
    id: "immo.whatsapp",
    label: "WhatsApp",
    icon: "💬",
    variant: "outline",
    order: 6,
    visible: (context) => {
      const meta = parseImmoMeta(context.publication.meta);
      return !!meta.phone;
    },
    execute: async (context) => {
      const meta = parseImmoMeta(context.publication.meta);
      if (meta.phone) {
        const cleaned = meta.phone.replace(/[^0-9]/g, "");
        Linking.openURL(String(`https://wa.me/${cleaned}`));
      }
    },
  },
];
