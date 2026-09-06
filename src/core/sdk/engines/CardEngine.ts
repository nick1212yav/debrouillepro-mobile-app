import type { ModuleManifest } from "../types"; // ✅ type-only import

export function buildCardData(publication: any, manifest: ModuleManifest) {
  const meta = publication.meta || {};
  const result: any = {
    hero: publication.title || "Sans titre",
  };
  manifest.card.sections?.forEach((key: string) => {
    result[key] = meta[key] ?? publication[key];
  });
  return result;
}
