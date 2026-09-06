// src/features/events/types/index.ts
import type { Id } from "@/convex/_generated/dataModel";

export type EventCategory =
  | "culturel"
  | "sportif"
  | "religieux"
  | "professionnel"
  | "communautaire"
  | "formation"
  | "festival"
  | "autre";

export type EventStatus = "upcoming" | "ongoing" | "past" | "cancelled";

export interface EventAttendee {
  userId: Id<"users">; // ✅ toujours défini dans le frontend
  name: string;
  avatar?: string;
  status: "attending" | "interested" | "not_going";
  joinedAt: number;
}

export interface EventComment {
  _id: Id<"eventComments">;
  _creationTime: number;
  authorId: Id<"users">;
  authorName?: string;
  authorAvatar?: string;
  text: string;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  replies?: EventComment[];
  replyToId?: Id<"eventComments">;
}

export interface EventTicket {
  _id: Id<"eventTickets">;
  eventId: Id<"events">;
  userId: Id<"users">;
  ticketNumber: string;
  qrCode: string;
  status: "valid" | "used" | "cancelled";
  purchasedAt: number;
  usedAt?: number;
}

export interface Event {
  _id: Id<"events">;
  _creationTime: number;
  authorId: Id<"users">;
  authorName?: string;
  authorAvatar?: string;
  title: string;
  description: string;
  category: EventCategory;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverImage?: string;
  gallery: string[];
  videos: string[];
  maxAttendees?: number;
  isFree: boolean;
  price?: string;
  tags: string[];
  status: EventStatus;
  attendingCount: number;
  interestedCount: number;
  notGoingCount: number;
  viewCount: number;
  shareCount: number;
  commentCount: number;
  isAttending: boolean;
  isInterested: boolean;
  isMine: boolean;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  attendees: EventAttendee[];
  comments: EventComment[];
  tickets: EventTicket[];
}

// Le reste (constantes, etc.) reste inchangé.
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  culturel: "Culturel",
  sportif: "Sportif",
  religieux: "Religieux",
  professionnel: "Professionnel",
  communautaire: "Communautaire",
  formation: "Formation",
  festival: "Festival",
  autre: "Autre",
};

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  culturel: "#8B5CF6",
  sportif: "#3B82F6",
  religieux: "#F59E0B",
  professionnel: "#6366F1",
  communautaire: "#EC4899",
  formation: "#10B981",
  festival: "#F97316",
  autre: "#9CA3AF",
};

export const CATEGORY_ICONS: Record<EventCategory, string> = {
  culturel: "🎭",
  sportif: "⚽",
  religieux: "⛪",
  professionnel: "💼",
  communautaire: "🤝",
  formation: "📚",
  festival: "🎪",
  autre: "📌",
};

export const STATUS_LABELS: Record<
  EventStatus,
  { label: string; color: string; bg: string }
> = {
  upcoming: { label: "À venir", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  ongoing: { label: "En cours", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  past: { label: "Terminé", color: "#9CA3AF", bg: "rgba(156,163,175,0.15)" },
  cancelled: { label: "Annulé", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
};

export interface EventFormData {
  title: string;
  description: string;
  category: EventCategory;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  maxAttendees?: number;
  isFree: boolean;
  price?: string;
  tags: string[];
}
