import { ModuleRegistry } from "../registry/ModuleRegistry";
import type { ModuleManifest } from "../types";

interface BootOptions {
  modules: ModuleManifest[];
}

export class Boot {
  static async start(options: BootOptions) {
    const { modules } = options;

    // 1. Enregistrer les modules
    for (const manifest of modules) {
      ModuleRegistry.register(manifest);
    }

    // 2. Geler le registre
    ModuleRegistry.freeze();

    console.log("✅ DébrouillePro SDK booté");
  }
}
