// src/features/publications/components/PublicationRenderer.tsx

import React from "react";

import type { Publication } from "../types";
import { getPublicationRenderer } from "../registry";
import { PublicationCard } from "./PublicationCard";

interface PublicationRendererProps {
  publication: Publication;
  index: number;

  onLike: () => void;
  onVote?: (optionId: string) => void;
  onDelete?: () => void;
  onAction: (actionId: string) => void;
  onCTA: () => void;

  actionsSlot?: React.ReactNode;

  isLiked?: boolean;
  isBookmarked?: boolean;

  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
}

export function PublicationRenderer({
  publication,
  index,
  onLike,
  onVote,
  onDelete,
  onAction,
  onCTA,
  actionsSlot,
  isLiked = false,
  isBookmarked = false,
  onComment,
  onShare,
  onBookmark,
}: PublicationRendererProps) {
  const renderer = getPublicationRenderer(publication.type);

  if (renderer) {
    return renderer({
      publication,
      index,
      onLike,
      onVote,
      onDelete,
      onAction,
      onCTA,
      actionsSlot,
      isLiked,
      isBookmarked,
      onComment,
      onShare,
      onBookmark,
    });
  }

  return (
    <PublicationCard
      publication={publication}
      index={index}
      onLike={onLike}
      onVote={onVote}
      onDelete={onDelete}
      onAction={onAction}
      onCTA={onCTA}
      actionsSlot={actionsSlot}
    />
  );
}
