import { manifest } from "./manifest";
import { RestaurationLifecycle } from "./lifecycle";

export class RestaurationRegistry {
  /**
   * Enregistre le module dans la plateforme d'orchestration de l'application
   */
  public static registerModule(globalModuleRegistry: any): void {
    if (!globalModuleRegistry) {
      console.warn(
        "[Restauration Registry] Registre global introuvable. Enregistrement en mode autonome.",
      );
      return;
    }

    globalModuleRegistry.register({
      id: manifest.id,
      name: manifest.name,
      manifest: manifest,
      lifecycle: {
        boot: () => RestaurationLifecycle.onBoot(),
        install: () => RestaurationLifecycle.onInstall(),
        shutdown: () => RestaurationLifecycle.onShutdown(),
      },
    });

    console.log(
      `[Restauration Registry] Module '${manifest.name}' enregistré avec succès.`,
    );
  }
}
