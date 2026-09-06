// src/features/messages/events/services/events.service.ts

import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";

export type EventId = Id<"events">;
export type PublicationId = Id<"publications">;

export type EventRsvpStatus = "attending" | "interested" | "not_going";

export type EventStatus = "upcoming" | "ongoing" | "past" | "cancelled";

export type EventCategory =
  | "culturel"
  | "sportif"
  | "religieux"
  | "professionnel"
  | "communautaire"
  | "formation"
  | "festival"
  | "autre";

export type MessageEvent = {
  _id: EventId;
  _creationTime: number;

  authorId: Id<"users">;

  title: string;
  description: string;
  category: EventCategory;

  startDate: string;
  endDate?: string;

  location: string;
  address?: string;

  coverImage?: string;

  maxAttendees?: number;

  isFree: boolean;
  price?: string;

  tags: string[];

  gallery?: string[];
  videos?: string[];

  status: EventStatus;

  attendingCount?: number;
  interestedCount?: number;
  notGoingCount?: number;
  commentCount?: number;
  viewCount?: number;

  authorName?: string;
  authorAvatar?: string;

  isAttending?: boolean;
  isInterested?: boolean;
  isMine?: boolean;

  likedByMe?: boolean;
  bookmarkedByMe?: boolean;

  myRsvp?: EventRsvpStatus | null;

  attendees?: Array<{
    userId?: Id<"users">;
    name: string;
    avatar?: string;
    status: string;
    joinedAt: number;
  }>;
};

export const eventsApi = {
  get: api.events.get,
  getMyRsvp: api.events.getMyRsvp,
  rsvp: api.events.rsvp,
  trackView: api.events.trackView,
  like: api.events.like,
  bookmark: api.events.bookmark,

  getPublication: api.publications.getPublication,
} as const;

export function extractEventIdFromPublication(
  publication:
    | {
        meta?: unknown;
      }
    | null
    | undefined,
): EventId | null {
  if (!publication?.meta) {
    return null;
  }

  let meta: unknown = publication.meta;

  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      return null;
    }
  }

  if (typeof meta !== "object" || meta === null || !("eventId" in meta)) {
    return null;
  }

  const eventId = (meta as { eventId?: unknown }).eventId;

  return typeof eventId === "string" ? (eventId as EventId) : null;
}
