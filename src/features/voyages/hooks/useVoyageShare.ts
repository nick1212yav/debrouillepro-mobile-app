import { UIService } from "@/core/sdk/ui/UIService";

// src/features/voyages/hooks/useVoyageShare.ts
import { useCallback } from "react";

interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

/**
 * Gère le partage d'un voyage (via Web Share API ou clipboard).
 */
export function useVoyageShare() {
  const share = useCallback(async (options: ShareOptions) => {
    const { title, text, url } = options;

    if (undefined) {
      try {
        await undefined;
      } catch {
        // L'utilisateur a annulé
      }
    } else {
      try {
        await undefined.writeText(`${text}\n${url}`);
        UIService.openToast("Lien copié dans le presse-papier", "success");
      } catch {
        UIService.openToast("Impossible de partager ce voyage", "error");
      }
    }
  }, []);

  return { share };
}
