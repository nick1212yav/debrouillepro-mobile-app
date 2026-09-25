// src/features/publications/modules/transport.tsx

import { TransportCard } from "@/features/transport/components/TransportCard";

import { registerPublicationRenderer } from "../registry";

registerPublicationRenderer(
  "transport",
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
    <TransportCard
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
