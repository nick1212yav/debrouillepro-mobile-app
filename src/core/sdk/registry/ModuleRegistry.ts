import type { ModuleManifest } from "../types";
import { SDK_VERSION } from "../constants";

const manifests = new Map<string, ModuleManifest>();
let frozen = false;

export const ModuleRegistry = {
  register: (manifest: ModuleManifest) => {
    if (frozen) throw new Error("Registry is frozen, cannot register");
    if (manifests.has(manifest.info.id)) {
      console.warn(`Overwriting ${manifest.info.id}`);
    }
    if (manifest.compatibility?.sdk) {
      if (SDK_VERSION !== manifest.compatibility.sdk) {
        console.warn(
          `Module ${manifest.info.id} requires SDK ${manifest.compatibility.sdk}, current ${SDK_VERSION}`,
        );
      }
    }
    manifests.set(manifest.info.id, manifest);
  },
  get: (id: string): ModuleManifest | undefined => manifests.get(id),
  getAll: (): ModuleManifest[] => Array.from(manifests.values()),
  getIds: (): string[] => Array.from(manifests.keys()),
  has: (id: string): boolean => manifests.has(id),
  freeze: () => {
    frozen = true;
  },
  isFrozen: () => frozen,
  validate: (id: string): boolean => {
    const m = manifests.get(id);
    if (!m) return false;
    return !!(m.info.id && m.fields && m.actions);
  },
};
