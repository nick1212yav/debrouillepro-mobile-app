// src/features/publications/meta.ts

import type { Publication } from "./types";

export type MetaRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is MetaRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMeta(meta: unknown): MetaRecord {
  if (typeof meta === "string") {
    try {
      const parsed: unknown = JSON.parse(meta);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isRecord(meta) ? meta : {};
}

export function getString(
  meta: MetaRecord,
  key: string,
  fallback = "",
): string {
  const value = meta[key];
  return typeof value === "string" ? value : fallback;
}

export function getOptionalString(
  meta: MetaRecord,
  key: string,
): string | undefined {
  const value = meta[key];
  return typeof value === "string" ? value : undefined;
}

export function getNumber(meta: MetaRecord, key: string, fallback = 0): number {
  const value = meta[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function getOptionalNumber(
  meta: MetaRecord,
  key: string,
): number | undefined {
  const value = meta[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function getBoolean(
  meta: MetaRecord,
  key: string,
  fallback = false,
): boolean {
  const value = meta[key];
  return typeof value === "boolean" ? value : fallback;
}

export function getStringArray(meta: MetaRecord, key: string): string[] {
  const value = meta[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

export function getUnknownArray(meta: MetaRecord, key: string): unknown[] {
  const value = meta[key];
  return Array.isArray(value) ? value : [];
}

export function getRecord(meta: MetaRecord, key: string): MetaRecord {
  const value = meta[key];
  return isRecord(value) ? value : {};
}

/* ── Images ──────────────────────────────────────────────────────────── */

export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }
  if (url.startsWith("blob:")) {
    return false;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return true;
  }
  if (url.startsWith("data:image")) {
    return true;
  }
  if (url.startsWith("kg")) {
    return false;
  }
  return url.length >= 3;
}

export function extractValidImages(raw: unknown): string[] {
  if (typeof raw === "string") {
    return isValidImageUrl(raw) ? [raw] : [];
  }

  if (Array.isArray(raw)) {
    return raw.filter(
      (url): url is string => typeof url === "string" && isValidImageUrl(url),
    );
  }

  return [];
}

/* ── Extras publication (auteur enrichi, bookmark, etc.) ─────────────── */

export type ProductLikeAuthor = {
  name?: string;
  avatar?: string;
};

export type PublicationWithExtras = Publication & {
  author?: ProductLikeAuthor;
  authorName?: string;
  authorAvatar?: string;
  bookmarkCount?: number;
  bookmarkedByMe?: boolean;
};

export function getPublicationExtras(
  publication: Publication,
): PublicationWithExtras {
  return publication as PublicationWithExtras;
}
