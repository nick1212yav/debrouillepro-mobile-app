import type { HomeSectionItem } from "../types/home-section.types";

type RawHomeItem = Record<string, unknown>;

export type NormalizedHomeCard = HomeSectionItem & {
  moduleId: string;
  title: string;
  description: string;
  image: string;
  route: string;
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Vérifie qu'un élément possède réellement les données
 * nécessaires pour être affiché comme carte de contenu.
 *
 * Une carte générique de module ne passe PAS cette validation.
 */
export function isCompleteHomeCard(value: unknown): value is RawHomeItem & {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  image: string;
  route: string;
} {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const item = value as RawHomeItem;

  const id = stringValue(item.id);
  const moduleId = stringValue(item.moduleId);
  const title = stringValue(item.title);
  const description = stringValue(item.description);
  const image = stringValue(item.image);
  const route = stringValue(item.route);

  if (!id) return false;
  if (!moduleId) return false;
  if (!title) return false;
  if (!description) return false;
  if (!image) return false;
  if (!route) return false;

  // Empêche les placeholders génériques.
  if (title.toLowerCase() === "contenu") {
    return false;
  }

  if (title.toLowerCase() === "sans titre") {
    return false;
  }

  if (description.toLowerCase() === "contenu") {
    return false;
  }

  return true;
}

/**
 * Normalise le feed Home.
 *
 * Les cartes incomplètes sont volontairement éliminées.
 * Elles ne doivent jamais être transformées en cartes génériques.
 */
export function normalizeHomeCards(items: unknown[]): NormalizedHomeCard[] {
  return items.filter((item): item is NormalizedHomeCard =>
    isCompleteHomeCard(item),
  ) as NormalizedHomeCard[];
}

/**
 * Variante stricte utilisée pour les éléments
 * venant d'un module générique.
 *
 * Un élément Transport générique comme :
 *
 * {
 *   moduleId: "transport",
 *   title: "transport",
 *   description: "Contenu"
 * }
 *
 * est donc rejeté.
 */
export function isRealContentCard(item: unknown): boolean {
  if (!isCompleteHomeCard(item)) {
    return false;
  }

  const value = item as RawHomeItem;

  const moduleId = stringValue(value.moduleId).toLowerCase();

  const title = stringValue(value.title).toLowerCase();

  const description = stringValue(value.description).toLowerCase();

  const genericTitles = new Set([
    "transport",
    "contenu",
    "sans titre",
    "module",
    "publication",
  ]);

  if (genericTitles.has(title)) {
    return false;
  }

  if (description === "contenu") {
    return false;
  }

  // Un moduleId seul ne suffit jamais.
  // Il faut une vraie carte de contenu.
  if (!moduleId) {
    return false;
  }

  return true;
}

/**
 * Filtre final du feed Home.
 */
export function cleanHomeFeed(items: unknown[]): NormalizedHomeCard[] {
  return items.filter((item): item is NormalizedHomeCard =>
    isRealContentCard(item),
  ) as NormalizedHomeCard[];
}
