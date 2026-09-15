import type { ActionConfig } from "../../core/sdk/types";
import { Clipboard } from "@react-native-clipboard/clipboard";
import { Share } from "react-native";

// ✅ Statuts possibles dans ton modèle (à adapter selon tes données)
// Exemples : "active", "open", "published", "closed", "sold", "filled"
type JobStatus = string;

export const actions: ActionConfig[] = [
  {
    id: "job.apply",
    label: "Postuler",
    icon: "📩",
    variant: "default",
    order: 1,

    // ✅ Visibilité : l'offre est visible si le statut est "actif" ou "ouvert"
    visible: (context) => {
      const status = context.publication?.status as JobStatus;
      // Log pour voir le statut réel (à supprimer une fois que tout fonctionne)
      console.log(`[job.apply] status = "${status}"`);

      // On considère que l'offre est ouverte si le statut est :
      // - "active" (le plus courant dans ton feed)
      // - "open" (si présent)
      // - "published" (si présent)
      return status === "active" || status === "open" || status === "published";
    },

    // ✅ L'action est activée si l'utilisateur est connecté
    enabled: (context) => !!context.user,

    execute: async (context) => {
      console.log("🔵 job.apply exécuté avec:", context.publication);
      await context.ui.openSheet("job.apply", {
        publication: context.publication,
      });
    },
  },

  {
    id: "job.contact",
    label: "Contacter",
    icon: "💬",
    variant: "outline",
    order: 2,
    execute: async (context) => {
      context.ui.openToast("Contacter l'annonceur", "info");
    },
  },

  {
    id: "job.save",
    label: "Sauvegarder",
    icon: "❤️",
    variant: "ghost",
    order: 3,
    execute: async (context) => {
      context.ui.openToast("Offre sauvegardée", "success");
    },
  },

  {
    id: "job.share",
    label: "Partager",
    icon: "📤",
    variant: "ghost",
    order: 4,
    execute: async (context) => {
      if (navigator.share) {
        await Share.share({ message: String(context.publication.description) + "\n" + "\n" + String(window.location.href), title: context.publication.title });
      } else {
        await Clipboard.setString(window.location.href);
        context.ui.openToast("Lien copié !", "success");
      }
    },
  },
];
