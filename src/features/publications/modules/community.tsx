// src/features/publications/modules/community.tsx

import { Linking } from "react-native";

import { CommunityCard } from "@/features/community/components/CommunityCard";
import type {
  CommunityComment,
  CommunityPost,
  Mood,
  PollOption,
  PostStatus,
  PostType,
} from "@/features/community/types";

import {
  extractValidImages,
  getNumber,
  getOptionalString,
  getPublicationExtras,
  getString,
  getStringArray,
  isRecord,
  parseMeta,
} from "../meta";
import { registerPublicationRenderer } from "../registry";

/* ── Whitelists ───────────────────────────────────────────────────────── */

const POST_TYPES: readonly PostType[] = [
  "text",
  "question",
  "poll",
  "image",
  "video",
  "live",
  "story",
  "event",
  "evenement",
  "job",
  "service",
  "property",
  "annonce",
  "marketplace",
  "community",
];

const POST_STATUSES: readonly PostStatus[] = [
  "active",
  "archived",
  "deleted",
  "scheduled",
];

const MOODS: readonly Mood[] = [
  "happy",
  "sad",
  "excited",
  "angry",
  "peaceful",
  "funny",
  "loved",
  "tired",
  "inspired",
];

const AUDIENCES = ["public", "friends", "private"] as const;
type Audience = (typeof AUDIENCES)[number];

function isPostType(value: string): value is PostType {
  return (POST_TYPES as readonly string[]).includes(value);
}

function isPostStatus(value: string): value is PostStatus {
  return (POST_STATUSES as readonly string[]).includes(value);
}

function isMood(value: string): value is Mood {
  return (MOODS as readonly string[]).includes(value);
}

function isAudience(value: string): value is Audience {
  return (AUDIENCES as readonly string[]).includes(value);
}

/* ── Validators tableau ────────────────────────────────────────────────── */

function asPollOptions(raw: unknown[]): PollOption[] {
  return raw.filter(
    (item): item is PollOption =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.text === "string" &&
      typeof item.votes === "number",
  );
}

function asCommunityComments(raw: unknown[]): CommunityComment[] {
  return raw.filter(
    (item): item is CommunityComment =>
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

/* ── Renderer ──────────────────────────────────────────────────────────── */

registerPublicationRenderer(
  "community",
  ({
    publication,
    index,
    onLike,
    onVote,
    onAction,
    onCTA,
    onComment,
    onShare,
    onBookmark,
  }) => {
    const meta = parseMeta(publication.meta);
    const extras = getPublicationExtras(publication);

    const authorName =
      extras.authorName || getString(meta, "authorName", "Anonyme");
    const authorAvatar =
      extras.authorAvatar || getOptionalString(meta, "authorAvatar");

    const postTypeRaw = getString(meta, "postType", "text");
    const postType: PostType = isPostType(postTypeRaw) ? postTypeRaw : "text";

    const statusRaw = publication.status || "active";
    const status: PostStatus = isPostStatus(statusRaw) ? statusRaw : "active";

    const votedOptionId = publication.votedOptionId ?? undefined;
    const bookmarkCount =
      extras.bookmarkCount ?? getNumber(meta, "bookmarkCount", 0);

    const moodRaw = getOptionalString(meta, "mood");
    const mood: Mood | undefined =
      moodRaw !== undefined && isMood(moodRaw) ? moodRaw : undefined;

    const audienceRaw = getString(meta, "audience", "public");
    const audience: Audience = isAudience(audienceRaw) ? audienceRaw : "public";

    const communityPost: CommunityPost = {
      _id: publication._id,
      _creationTime: publication._creationTime,
      authorId: publication.authorId,
      authorName,
      authorAvatar,
      title: publication.title || undefined,
      description: publication.description || "",
      images: extractValidImages(publication.images),
      tags: publication.tags || [],
      likeCount: publication.likeCount || 0,
      commentCount: publication.commentCount || 0,
      viewCount: publication.viewCount || 0,
      shareCount: publication.shareCount || 0,
      bookmarkCount,
      likedByMe: publication.likedByMe || false,
      bookmarkedByMe: extras.bookmarkedByMe || false,
      isMine: publication.isMine || false,
      type: postType,
      meta: {
        postType,
        mood,
        audience,
        location: getString(meta, "location", publication.location || ""),
        mentions: getStringArray(meta, "mentions"),
        pollOptions: asPollOptions(
          Array.isArray(meta.pollOptions) ? meta.pollOptions : [],
        ),
        videos: getStringArray(meta, "videos"),
        audio: getStringArray(meta, "audio"),
        images: extractValidImages(meta.images),
      },
      status,
      votedOptionId,
      comments: asCommunityComments(
        Array.isArray(meta.comments) ? meta.comments : [],
      ),
    };

    const handleLike = () => {
      onLike();
    };

    const handleComment = () => {
      if (onComment) {
        onComment();
        return;
      }
      onCTA();
    };

    const handleShare = () => {
      if (onShare) {
        onShare();
        return;
      }
      onAction("share");
    };

    const handleBookmark = () => {
      if (onBookmark) {
        onBookmark();
        return;
      }
      onAction("bookmark");
    };

    const handleVote = (optionId: string) => {
      onVote?.(optionId);
    };

    const handleNavigate = () => {
      void Linking.openURL(`/community/${communityPost._id}`);
    };

    return (
      <CommunityCard
        post={communityPost}
        index={index}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onBookmark={handleBookmark}
        onVote={handleVote}
        onNavigate={handleNavigate}
      />
    );
  },
);
