// src/features/publications/modules/restauration.tsx

import { RestaurantCard } from "@/features/restauration/components/RestaurantCard";

import { registerPublicationRenderer } from "../registry";

registerPublicationRenderer(
  "restauration",
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
    <RestaurantCard
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
