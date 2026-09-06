// src/features/events/adapter.ts
import type { Doc } from "@/convex/_generated/dataModel";
import type {
  Event,
  EventAttendee,
  EventComment,
  EventTicket,
  EventStatus,
  EventCategory,
} from "./types";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Adapte un événement Convex (enrichi) en objet Event frontend.
 */
export function adaptEvent(event: any): Event {
  // ✅ Sécurisation des attendees avec transformation robuste
  const attendees: EventAttendee[] = (event.attendees || [])
    .filter((a: any) => a.userId && a.name)
    .map((a: any) => ({
      userId: a.userId as Id<"users">,
      name: a.name,
      avatar: a.avatar,
      status: a.status,
      joinedAt: a.joinedAt,
    }));

  return {
    _id: event._id,
    _creationTime: event._creationTime,
    authorId: event.authorId,
    authorName: event.authorName ?? undefined,
    authorAvatar: event.authorAvatar ?? undefined,
    title: event.title,
    description: event.description,
    category: event.category as EventCategory,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    address: event.address,
    latitude: event.latitude,
    longitude: event.longitude,
    coverImage: event.coverImage ?? undefined,
    gallery: event.gallery ?? [],
    videos: event.videos ?? [],
    maxAttendees: event.maxAttendees,
    isFree: event.isFree,
    price: event.price,
    tags: event.tags ?? [],
    status: event.status as EventStatus,
    attendingCount: event.attendingCount ?? 0,
    interestedCount: event.interestedCount ?? 0,
    notGoingCount: event.notGoingCount ?? 0,
    viewCount: event.viewCount ?? 0,
    shareCount: event.shareCount ?? 0,
    commentCount: event.commentCount ?? 0,
    isAttending: event.isAttending ?? false,
    isInterested: event.isInterested ?? false,
    isMine: event.isMine ?? false,
    likedByMe: event.likedByMe ?? false,
    bookmarkedByMe: event.bookmarkedByMe ?? false,
    attendees,
    comments: event.comments ?? [],
    tickets: event.tickets ?? [],
  };
}

export function adaptEventComment(comment: any): EventComment {
  return {
    _id: comment._id,
    _creationTime: comment._creationTime,
    authorId: comment.authorId,
    authorName: comment.authorName ?? undefined,
    authorAvatar: comment.authorAvatar ?? undefined,
    text: comment.text,
    likeCount: comment.likeCount ?? 0,
    likedByMe: comment.likedByMe ?? false,
    isMine: comment.isMine ?? false,
    replies: [],
    replyToId: comment.parentId,
  };
}

export function adaptEventTicket(ticket: any): EventTicket {
  return {
    _id: ticket._id,
    eventId: ticket.eventId,
    userId: ticket.userId,
    ticketNumber: ticket.ticketNumber,
    qrCode: ticket.qrCode,
    status: ticket.status,
    purchasedAt: ticket.purchasedAt,
    usedAt: ticket.usedAt,
  };
}
