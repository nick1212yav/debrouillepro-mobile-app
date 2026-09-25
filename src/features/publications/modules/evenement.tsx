// src/features/publications/modules/evenement.tsx

import { EventCard } from "@/features/events/components/EventCard";
import type {
  Event,
  EventAttendee,
  EventCategory,
  EventComment,
  EventStatus,
  EventTicket,
} from "@/features/events/types";

import type { Id } from "../../../../convex/_generated/dataModel";

import {
  extractValidImages,
  getBoolean,
  getNumber,
  getOptionalNumber,
  getOptionalString,
  getPublicationExtras,
  getString,
  getStringArray,
  isRecord,
  parseMeta,
} from "../meta";
import { registerPublicationRenderer } from "../registry";
import type { Publication } from "../types";

/* ── Whitelists ───────────────────────────────────────────────────────── */

const EVENT_CATEGORIES: readonly EventCategory[] = [
  "culturel",
  "sportif",
  "religieux",
  "professionnel",
  "communautaire",
  "formation",
  "festival",
  "autre",
];

const EVENT_STATUSES: readonly EventStatus[] = [
  "upcoming",
  "ongoing",
  "past",
  "cancelled",
];

function isEventCategory(value: string): value is EventCategory {
  return (EVENT_CATEGORIES as readonly string[]).includes(value);
}

function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value);
}

/* ── Conversions ──────────────────────────────────────────────────────── */

/**
 * Une publication `evenement` et un `event` Convex partagent le même
 * identifiant applicatif (relation 1-1). TypeScript ne peut pas le savoir,
 * donc on l'annote à un seul endroit.
 */
function asEventId(publicationId: Publication["_id"]): Id<"events"> {
  return publicationId as unknown as Id<"events">;
}

function asEventAttendees(raw: unknown[]): EventAttendee[] {
  return raw.filter(
    (item): item is EventAttendee =>
      isRecord(item) &&
      typeof item.userId === "string" &&
      typeof item.name === "string" &&
      (item.status === "attending" ||
        item.status === "interested" ||
        item.status === "not_going") &&
      typeof item.joinedAt === "number",
  );
}

function asEventComments(raw: unknown[]): EventComment[] {
  return raw.filter(
    (item): item is EventComment =>
      isRecord(item) &&
      typeof item._id === "string" &&
      typeof item._creationTime === "number" &&
      typeof item.authorId === "string" &&
      typeof item.text === "string" &&
      typeof item.likeCount === "number" &&
      typeof item.likedByMe === "boolean" &&
      typeof item.isMine === "boolean",
  );
}

function asEventTickets(raw: unknown[]): EventTicket[] {
  return raw.filter(
    (item): item is EventTicket =>
      isRecord(item) &&
      typeof item._id === "string" &&
      typeof item.eventId === "string" &&
      typeof item.userId === "string" &&
      typeof item.ticketNumber === "string" &&
      typeof item.qrCode === "string" &&
      (item.status === "valid" ||
        item.status === "used" ||
        item.status === "cancelled") &&
      typeof item.purchasedAt === "number",
  );
}

/* ── Renderer ──────────────────────────────────────────────────────────── */

registerPublicationRenderer(
  "evenement",
  ({ publication, index, onLike, onBookmark, onShare }) => {
    const meta = parseMeta(publication.meta);
    const extras = getPublicationExtras(publication);

    const eventId = getString(meta, "eventId")
      ? (getString(meta, "eventId") as unknown as Id<"events">)
      : asEventId(publication._id);

    let images = extractValidImages(publication.images);
    if (images.length === 0) {
      images = extractValidImages(meta.gallery);
      if (images.length === 0) {
        images = extractValidImages(meta.coverImage);
      }
    }

    const authorName =
      extras.authorName || getString(meta, "authorName", "Anonyme");
    const authorAvatar =
      extras.authorAvatar || getOptionalString(meta, "authorAvatar");
    const bookmarkedByMe = extras.bookmarkedByMe ?? false;

    const categoryRaw = getString(meta, "category", "autre");
    const category: EventCategory = isEventCategory(categoryRaw)
      ? categoryRaw
      : "autre";

    const statusRaw = getString(meta, "status", "upcoming");
    const status: EventStatus = isEventStatus(statusRaw)
      ? statusRaw
      : "upcoming";

    const event: Event = {
      _id: eventId,
      _creationTime: publication._creationTime,
      authorId: publication.authorId,
      authorName,
      authorAvatar,
      title: publication.title || "",
      description: publication.description || "",
      category,
      startDate: getString(meta, "startDate", new Date().toISOString()),
      endDate: getOptionalString(meta, "endDate"),
      location: getString(meta, "location", publication.location || ""),
      address: getOptionalString(meta, "address"),
      coverImage: images[0],
      gallery: images,
      videos: getStringArray(meta, "videos"),
      maxAttendees: getOptionalNumber(meta, "maxAttendees"),
      isFree: getBoolean(meta, "isFree", true),
      price: getOptionalString(meta, "price"),
      tags: publication.tags ?? getStringArray(meta, "tags"),
      status,
      attendingCount: getNumber(meta, "attendingCount", 0),
      interestedCount: getNumber(meta, "interestedCount", 0),
      notGoingCount: getNumber(meta, "notGoingCount", 0),
      viewCount: publication.viewCount || 0,
      shareCount: publication.shareCount || 0,
      commentCount: publication.commentCount || 0,
      isAttending: getBoolean(meta, "isAttending", false),
      isInterested: getBoolean(meta, "isInterested", false),
      isMine: publication.isMine ?? false,
      likedByMe: publication.likedByMe ?? false,
      bookmarkedByMe,
      attendees: asEventAttendees(
        Array.isArray(meta.attendees) ? meta.attendees : [],
      ),
      comments: asEventComments(
        Array.isArray(meta.comments) ? meta.comments : [],
      ),
      tickets: asEventTickets(Array.isArray(meta.tickets) ? meta.tickets : []),
    };

    return (
      <EventCard
        event={event}
        index={index}
        onLike={onLike}
        onBookmark={onBookmark}
        onShare={onShare}
      />
    );
  },
);
