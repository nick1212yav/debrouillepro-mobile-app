// src/features/community/adapter.ts
import type { Doc } from "@/convex/_generated/dataModel";
import type {
  CommunityPost,
  PostMeta,
  PostType,
  CommunityComment,
  CommunityGroup,
  CommunityEvent,
  CommunityStory,
} from "./types";

/**
 * Adapte une publication (peut être enrichie par getPublication)
 * en objet CommunityPost.
 */
export function adaptCommunityPost(pub: any): CommunityPost {
  // pub peut contenir : authorName, authorAvatar, likedByMe, bookmarkedByMe, isMine, shareCount, bookmarkCount

  let meta: PostMeta = { postType: "text" };
  if (pub.meta) {
    try {
      const parsed =
        typeof pub.meta === "string" ? JSON.parse(pub.meta) : pub.meta;
      meta = {
        postType: "text",
        ...parsed,
      };
    } catch {
      meta = { postType: "text" };
    }
  }

  const images = meta.images || pub.images || [];
  const authorName = pub.authorName || undefined;
  const authorAvatar = pub.authorAvatar || undefined;

  return {
    _id: pub._id,
    _creationTime: pub._creationTime,
    authorId: pub.authorId,
    authorName,
    authorAvatar,
    type: (meta.postType as PostType) || "text",
    title: pub.title ?? "",
    description: pub.description ?? "",
    images,
    tags: pub.tags || [],
    likeCount: pub.likeCount ?? 0,
    commentCount: pub.commentCount ?? 0,
    viewCount: pub.viewCount ?? 0,
    shareCount: pub.shareCount ?? 0,
    bookmarkCount: pub.bookmarkCount ?? 0,
    likedByMe: pub.likedByMe ?? false,
    bookmarkedByMe: pub.bookmarkedByMe ?? false,
    isMine: pub.isMine ?? false,
    meta: {
      postType: meta.postType || "text",
      location: meta.location ?? "",
      latitude: meta.latitude ?? undefined,
      longitude: meta.longitude ?? undefined,
      pollOptions: meta.pollOptions ?? [],
      eventDate: meta.eventDate ?? undefined,
      eventLocation: meta.eventLocation ?? "",
      audience: meta.audience ?? "public",
      mood: meta.mood ?? undefined,
      videos: meta.videos ?? [],
      audio: meta.audio ?? [],
      mentions: meta.mentions ?? [],
      images: images,
      votedOptionId: meta.votedOptionId ?? undefined,
    },
    status: (pub.status as any) || "active",
    votedOptionId: meta.votedOptionId ?? undefined,
  };
}

// Les autres adaptateurs (comment, group, event, story) restent inchangés...
export function adaptCommunityComment(
  comment: Doc<"comments">,
): CommunityComment {
  return {
    _id: comment._id,
    _creationTime: comment._creationTime,
    authorId: comment.authorId,
    authorName: undefined,
    authorAvatar: undefined,
    text: comment.text,
    likeCount: 0,
    likedByMe: false,
    isMine: false,
    replies: [],
    replyToId: comment.parentId,
  };
}

export function adaptCommunityGroup(group: Doc<"groups">): CommunityGroup {
  return {
    _id: group._id,
    adminId: group.adminId,
    name: group.name,
    description: group.description,
    coverImage: group.coverImage,
    avatar: group.avatar,
    category: group.category,
    isPrivate: group.isPrivate,
    memberCount: group.memberCount || 0,
    isMember: false,
    isAdmin: false,
    tags: group.tags || [],
    city: group.city,
    emoji: "👥",
    color: "#8B5CF6",
  };
}

export function adaptCommunityEvent(event: Doc<"events">): CommunityEvent {
  return {
    _id: event._id,
    authorId: event.authorId,
    title: event.title,
    description: event.description,
    category: event.category,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    address: event.address,
    latitude: event.latitude,
    longitude: event.longitude,
    coverImage: event.coverImage,
    maxAttendees: event.maxAttendees,
    isFree: event.isFree,
    price: event.price,
    tags: event.tags || [],
    status: event.status,
    attendeeCount: 0,
    isAttending: false,
  };
}

export function adaptCommunityStory(story: Doc<"stories">): CommunityStory {
  return {
    _id: story._id,
    authorId: story.authorId,
    authorName: undefined,
    authorAvatar: undefined,
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption,
    duration: story.duration,
    viewCount: story.viewCount || 0,
    expiresAt: story.expiresAt,
    isHighlight: story.isHighlight || false,
    isViewed: false,
  };
}
