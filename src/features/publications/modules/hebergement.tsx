// src/features/publications/modules/hebergement.tsx

import { HebergementCard } from "@/features/hebergement/components/HebergementCard";

import { registerPublicationRenderer } from "../registry";

registerPublicationRenderer(
  "hebergement",
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
    <HebergementCard
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
