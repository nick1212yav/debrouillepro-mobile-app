// src/features/transport/lifecycle.ts
import { LiveLocationTracker } from "./tracking/LiveLocationTracker";

export const lifecycle = {
  /**
   * Exécuté au démarrage global de l'application (Super-App Boot)
   */
  onInit(): void {
    console.log(
      "[Transport Lifecycle] Initialisation du module de mobilité panafricaine [2]...",
    );
  },

  /**
   * Exécuté à l'ouverture de l'espace Transport (Mount)
   */
  onMount(): void {
    console.log("[Transport Lifecycle] Montage de la page Transport [2].");
  },

  /**
   * Exécuté à la fermeture complète de la page Transport (Unmount)
   */
  onUnmount(): void {
    console.log(
      "[Transport Lifecycle] Démontage de la page Transport. Nettoyage matériel du récepteur GPS [2]...",
    );
    // Sécurité impérative pour préserver la batterie de l'appareil mobile de l'utilisateur [2]
    LiveLocationTracker.stopTracking();
  },
};
