// convex/search/sources/index.ts
//
// ─── REGISTRE DE SOURCES ─────────────────────────────────────────────────
//
// Ce fichier est le SEUL endroit où les source adapters sont enregistrés.
//
// Ajouter un module finalisé =
//   1. Créer son source adapter dans sources/<name>.ts
//   2. L'ajouter au map SOURCE_REGISTRY ci-dessous
//   3. Ajouter son entrée dans registry.ts (si pas déjà fait)

import type { SourceAdapter } from "../types";

import { publicationsSource } from "./publications";
import { propertiesSource } from "./properties";
import { jobListingsSource } from "./jobListings";
import { coursesSource } from "./courses";
import { liveStreamsSource } from "./liveStreams";

export const SOURCE_REGISTRY: Map<string, SourceAdapter> = new Map([
  ["publications", publicationsSource],
  ["properties", propertiesSource],
  ["jobListings", jobListingsSource],
  ["courses", coursesSource],
  ["liveStreams", liveStreamsSource],
]);
