// src/features/publications/registry.ts

import type React from "react";

import type { Publication, PublicationType } from "./types";

/**
 * Contexte passé à chaque renderer de module.
 * Contrat unique entre PublicationRenderer et les modules métier.
 */
export type PublicationRenderContext = {
  publication: Publication;
  index: number;

  onLike: () => void;
  onVote?: (optionId: string) => void;
  onDelete?: () => void;
  onAction: (actionId: string) => void;
  onCTA: () => void;

  actionsSlot?: React.ReactNode;

  isLiked: boolean;
  isBookmarked: boolean;

  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
};

export type ModuleRenderer = (ctx: PublicationRenderContext) => React.ReactNode;

const registry = new Map<PublicationType, ModuleRenderer>();

/**
 * Enregistre le renderer d'un module pour un type de publication.
 * À appeler une seule fois au démarrage de l'app.
 */
export function registerPublicationRenderer(
  type: PublicationType,
  renderer: ModuleRenderer,
): void {
  if (registry.has(type)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[PublicationRegistry] Renderer for "${type}" is being overridden.`,
    );
  }

  registry.set(type, renderer);
}

/**
 * Récupère le renderer enregistré pour un type donné.
 * Retourne `undefined` si le module n'a pas encore migré.
 */
export function getPublicationRenderer(
  type: PublicationType,
): ModuleRenderer | undefined {
  return registry.get(type);
}
