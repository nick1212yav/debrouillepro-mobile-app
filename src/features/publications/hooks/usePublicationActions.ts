import { useRouter } from "expo-router";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

import { ActionRegistry } from "@/core/sdk/registry/ActionRegistry";
import { UIService } from "@/core/sdk/ui/UIService";

import { getPublicationConfig } from "../config";
import type { Publication } from "../types";

export function usePublicationActions() {
  const router = useRouter();
  const { user } = useFirebaseAuth();

  const handleAction = async (actionId: string, publication: Publication) => {
    switch (actionId) {
      case "like":
        UIService.openToast("Fonction bientôt disponible", "info");
        return;
      case "comment":
        router.push(`/publication/${publication._id}#comments`);
        return;
      case "share":
        try {
          if (undefined) {
            await undefined;
          } else {
            await undefined.writeText(undefined.href);
            UIService.openToast("Lien copié !", "success");
          }
        } catch {
          // utilisateur a annulé
        }
        return;
      case "save":
      case "bookmark":
        UIService.openToast("Publication sauvegardée", "success");
        return;
      case "contact":
        UIService.openToast("Ouverture du contact...", "info");
        return;
      case "call":
        UIService.openToast("Appel...", "info");
        return;
      case "navigate":
        UIService.openToast("Navigation...", "info");
        return;
      default:
        UIService.openToast(actionId, "info");
    }
  };

  const handleCTA = async (publication: Publication) => {
    if (!publication) return;

    const config = getPublicationConfig(publication.type);

    if (!config) {
      router.push(`/publication/${publication._id}`);
      return;
    }

    // ✅ Priorité au SDK via ActionRegistry
    if (config.cta?.action) {
      try {
        await ActionRegistry.execute(config.cta.action, {
          publication,
          user,
          services: {},
          router,
          ui: {
            openSheet: UIService.openSheet,
            openModal: UIService.openModal,
            openDrawer: UIService.openDrawer,
            openPlayer: UIService.openPlayer,
            openViewer: UIService.openViewer,
            openToast: UIService.openToast,
          },
        });
        return;
      } catch (error) {
        console.error("❌ [handleCTA] Erreur:", error);
        UIService.openToast("Impossible d'exécuter cette action", "error");
        return;
      }
    }

    // Compatibilité ancien système (route)
    if (config.cta?.route) {
      router(config.cta.route.replace(":id", publication._id));
      return;
    }

    // Fallback générique
    router.push(`/publication/${publication._id}`);
  };

  return {
    handleAction,
    handleCTA,
  };
}
