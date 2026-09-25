import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

import { ActionRegistry } from "@/core/sdk/registry/ActionRegistry";
import { UIService } from "@/core/sdk/ui/UIService";

import { getPublicationConfig } from "../config";
import type { Publication } from "../types";
import { Clipboard } from "@react-native-clipboard/clipboard";
import { Share } from "react-native";

export function usePublicationActions() {
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();

  const handleAction = async (actionId: string, publication: Publication) => {
    switch (actionId) {
      case "like":
        toast.info("Fonction bientôt disponible");
        return;
      case "comment":
        navigate(`/publication/${publication._id}#comments`);
        return;
      case "share":
        try {
          if (typeof navigator !== "undefined" && "share" in navigator) {
            await Share.share({
              message:
                String(publication.description ?? "") +
                "\n" +
                "\n" +
                String(window.location.href),
              title: publication.title,
            });
          } else {
            await Clipboard.setString(window.location.href);
            toast.success("Lien copié !");
          }
        } catch {
          // utilisateur a annulé
        }
        return;
      case "save":
      case "bookmark":
        toast.success("Publication sauvegardée");
        return;
      case "contact":
        toast.info("Ouverture du contact...");
        return;
      case "call":
        toast.info("Appel...");
        return;
      case "navigate":
        toast.info("Navigation...");
        return;
      default:
        toast.info(actionId);
    }
  };

  const handleCTA = async (publication: Publication) => {
    if (!publication) return;

    const config = getPublicationConfig(publication.type);

    if (!config) {
      navigate(`/publication/${publication._id}`);
      return;
    }

    // ✅ Priorité au SDK via ActionRegistry
    if (config.cta?.action) {
      try {
        await ActionRegistry.execute(config.cta.action, {
          publication,
          user,
          services: {},
          navigate,
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
        toast.error("Impossible d'exécuter cette action");
        return;
      }
    }

    // Compatibilité ancien système (route)
    if (config.cta?.route) {
      navigate(config.cta.route.replace(":id", publication._id));
      return;
    }

    // Fallback générique
    navigate(`/publication/${publication._id}`);
  };

  return {
    handleAction,
    handleCTA,
  };
}
