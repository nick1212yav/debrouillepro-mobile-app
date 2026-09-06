// src/features/community/types/index.ts
import type { Id } from "@/convex/_generated/dataModel";

export type PostType =
  | "text"
  | "question"
  | "poll"
  | "image"
  | "video"
  | "live"
  | "story"
  | "event"
  | "evenement" // ✅ Ajout pour correspondre au schéma Convex
  | "job"
  | "service"
  | "property"
  | "annonce"
  | "marketplace"
  | "community"; // ✅ Ajout pour les publications communautaires

export type LocalPostType = "text" | "question" | "poll";

export type PostStatus = "active" | "archived" | "deleted" | "scheduled";

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PostMeta {
  postType: PostType;
  emoji?: string;
  pollOptions?: PollOption[];
  eventDate?: string;
  eventLocation?: string;
  link?: string;
  fileUrl?: string;
  jobId?: Id<"jobListings">;
  serviceId?: Id<"serviceProviders">;
  propertyId?: Id<"properties">;
  annonceId?: Id<"publications">;
  marketplaceId?: Id<"products">;
  liveUrl?: string;
  storyDuration?: number;
  hasVoice?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  authorName?: string;
  authorAvatar?: string;
  mentions?: string[];
  groupId?: Id<"groups">;
  images?: string[];
  videos?: string[];
  audio?: string[];
  gifs?: string[];
  scheduleDate?: string;
  audience?: "public" | "friends" | "private";
  mood?: Mood;
  votedOptionId?: string; // ✅ Ajout pour stocker l'option votée d'un sondage
}

export interface CommunityPost {
  _id: Id<"publications">;
  _creationTime: number;
  authorId: Id<"users">;
  authorName?: string;
  authorAvatar?: string;
  type: PostType;
  title?: string;
  description: string;
  images: string[];
  tags: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
  bookmarkCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  isMine: boolean;
  meta: PostMeta;
  status: PostStatus;
  votedOptionId?: string;
  comments?: CommunityComment[];
}

export interface CommunityComment {
  _id: Id<"comments">;
  _creationTime: number;
  authorId: Id<"users">;
  authorName?: string;
  authorAvatar?: string;
  text: string;
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  replies?: CommunityComment[];
  replyToId?: Id<"comments">;
}

export interface CommunityGroup {
  _id: Id<"groups">;
  adminId: Id<"users">;
  name: string;
  description: string;
  coverImage?: string;
  avatar?: string;
  category: string;
  isPrivate: boolean;
  memberCount: number;
  isMember: boolean;
  isAdmin: boolean;
  tags: string[];
  city?: string;
  emoji?: string;
  color?: string;
}

export interface CommunityEvent {
  _id: Id<"events">;
  authorId: Id<"users">;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverImage?: string;
  maxAttendees?: number;
  isFree: boolean;
  price?: string;
  tags: string[];
  status: "upcoming" | "ongoing" | "past" | "cancelled";
  attendeeCount: number;
  isAttending: boolean;
}

export interface CommunityStory {
  _id: Id<"stories">;
  authorId: Id<"users">;
  authorName?: string;
  authorAvatar?: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  duration?: number;
  viewCount: number;
  expiresAt: string;
  isHighlight: boolean;
  isViewed: boolean;
}

export type Mood =
  | "happy"
  | "sad"
  | "excited"
  | "angry"
  | "peaceful"
  | "funny"
  | "loved"
  | "tired"
  | "inspired";

export interface Draft {
  _id?: Id<"drafts">;
  userId: Id<"users">;
  title?: string;
  description?: string;
  meta?: string;
  images?: string[];
  videos?: string[];
  audio?: string[];
  tags?: string[];
  location?: string;
  scheduleDate?: string;
  audience?: "public" | "friends" | "private";
  mood?: Mood;
  updatedAt: string;
}

export interface PostAttachment {
  type: "image" | "video" | "audio" | "gif";
  previewUrl: string;
  storageId?: Id<"_storage">;
  name?: string;
  size?: number;
}

export type CommunityFilter =
  | "all"
  | "mine"
  | "following"
  | "groups"
  | "events";
