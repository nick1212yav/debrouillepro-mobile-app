import type { ModuleManifest } from "../types";

export function buildDetailSections(
  publication: any,
  manifest: ModuleManifest,
) {
  const meta = publication.meta || {};
  const sections: { label: string; value: any }[] = [];
  manifest.fields.forEach((field) => {
    if (field.hidden) return;
    const value = meta[field.key] ?? publication[field.key];
    if (value === undefined || value === null) return;
    sections.push({ label: field.label, value });
  });
  return sections;
}
