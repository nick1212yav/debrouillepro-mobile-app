// src/features/publications/modules/sante.tsx

import { SanteCard } from "@/features/sante/components/SanteCard";

import { registerPublicationRenderer } from "../registry";

registerPublicationRenderer(
  "sante",
  ({
    publication,
    index,
    onLike,
    onComment,
    onShare,
    onBookmark,
    isLiked,
    isBookmarked,
  }) => (
    <SanteCard
      publication={publication}
      index={index}
      onLike={onLike}
      onComment={onComment}
      onShare={onShare}
      onBookmark={onBookmark}
      isLiked={isLiked}
      isBookmarked={isBookmarked}
    />
  ),
);
