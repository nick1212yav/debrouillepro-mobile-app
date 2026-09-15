// src/features/voyages/hooks/useVoyageShare.ts
import { useCallback } from "react";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

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

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // L'utilisateur a annulé
      }
    } else {
      try {
        await Clipboard.setString(`${text}\n${url}`);
        toast.success("Lien copié dans le presse-papier");
      } catch {
        toast.error("Impossible de partager ce voyage");
      }
    }
  }, []);

  return { share };
}
