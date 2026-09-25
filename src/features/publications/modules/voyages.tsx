// src/features/publications/modules/voyages.tsx

import { VoyageTripCard as VoyageCard } from "@/features/voyages/components/cards/VoyageTripCard";

import { registerPublicationRenderer } from "../registry";

registerPublicationRenderer(
  "voyages",
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
    <VoyageCard
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
