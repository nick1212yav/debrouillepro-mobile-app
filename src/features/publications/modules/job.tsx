// src/features/publications/modules/job.tsx

import { JobCard } from "@/features/job/components/JobCard";

import { registerPublicationRenderer } from "../registry";

registerPublicationRenderer(
  "job",
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
    <JobCard
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
