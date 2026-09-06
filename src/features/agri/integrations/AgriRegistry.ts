// src/features/agri/integrations/AgriRegistry.ts
export class AgriRegistry {
  private static isRegistered = false;

  /**
   * Enregistre le module Agriculture et ses configurations de métriques au sein du core/sdk de DébrouillePro.
   */
  static registerModule(): void {
    if (this.isRegistered) return;

    console.log(
      "🌱 Enregistrement du module d'Agriculture au sein du Core SDK...",
    );
    this.isRegistered = true;
  }
}
