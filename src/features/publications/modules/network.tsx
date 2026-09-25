// src/features/publications/modules/network.tsx

import { NetworkCard } from "@/features/network/components/NetworkCard";

import { registerPublicationRenderer } from "../registry";

registerPublicationRenderer(
  "network",
  ({
    publication,
    index,
    onLike,
    onComment,
    onShare,
    onBookmark,
    isLiked,
    isBookmarked,
    onAction,
  }) => {
    const handleNetworkAction = (action: string) => {
      onAction(action);
    };

    return (
      <NetworkCard
        publication={publication}
        index={index}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
        onNavigate={onAction}
        onActionClick={handleNetworkAction}
      />
    );
  },
);
