// src/features/creator-hub/types/index.ts

import type { Id } from "@/convex/_generated/dataModel";

export type CreatorLevel = {
  label: string;
  emoji: string;
  color: string;
  minFollowers: number;
  minPubs: number;
};

export interface Challenge {
  _id: string;
  title: string;
  description: string;
  hashtag: string;
  category: string;
  prize: string;
  endDate: string;
  participantCount: number;
  thumbnailUrl?: string;
}

export interface CreatorPub {
  _id: string;
  title: string;
  type: string;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  createdAt: number;
}
