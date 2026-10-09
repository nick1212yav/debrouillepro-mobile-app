// src/features/messages/events/services/events.service.ts

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

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

type PublicationMeta = {
  eventId?: unknown;
};

function isPublicationMeta(value: unknown): value is PublicationMeta {
  return typeof value === "object" && value !== null && "eventId" in value;
}

function parsePublicationMeta(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function extractEventIdFromPublication(
  publication:
    | {
        meta?: unknown;
      }
    | null
    | undefined,
): EventId | null {
  if (publication?.meta === undefined) {
    return null;
  }

  const meta = parsePublicationMeta(publication.meta);

  if (!isPublicationMeta(meta)) {
    return null;
  }

  return typeof meta.eventId === "string" ? (meta.eventId as EventId) : null;
}
