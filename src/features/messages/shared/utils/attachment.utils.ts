// src/features/messages/shared/utils/attachment.utils.ts

import type { Attachment } from "../../types";

// ============================================================================
// CATÉGORIES
// ============================================================================

export type AttachmentCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "other";

// ============================================================================
// MIME TYPE
// ============================================================================

/**
 * Retourne la catégorie d'un fichier à partir de son MIME type.
 */
export function getAttachmentCategory(
  mimeType?: string | null,
): AttachmentCategory {
  if (!mimeType) {
    return "other";
  }

  const mime = mimeType.toLowerCase().trim();

  if (mime.startsWith("image/")) {
    return "image";
  }

  if (mime.startsWith("video/")) {
    return "video";
  }

  if (mime.startsWith("audio/")) {
    return "audio";
  }

  if (
    mime.includes("pdf") ||
    mime.includes("document") ||
    mime.startsWith("text/") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation") ||
    mime.includes("msword") ||
    mime.includes("wordprocessing") ||
    mime.includes("excel") ||
    mime.includes("powerpoint") ||
    mime.includes("opendocument")
  ) {
    return "document";
  }

  return "other";
}

// ============================================================================
// HELPERS ATTACHMENT
// ============================================================================

/**
 * Retourne le MIME type réel d'un attachement.
 *
 * Le backend `attachments.ts` utilise `mimeType`.
 * Le modèle frontend utilise `fileMimeType`.
 *
 * Cette fonction centralise la compatibilité entre les deux.
 */
export function getAttachmentMimeType(
  attachment: Attachment | null | undefined,
): string | null {
  if (!attachment) {
    return null;
  }

  return attachment.fileMimeType?.trim() || null;
}

/**
 * Retourne l'URL média d'un attachement.
 *
 * `mediaUrl` est l'URL résolue par le frontend/service.
 * `fileId` reste l'identifiant source côté backend.
 */
export function getAttachmentUrl(
  attachment: Attachment | null | undefined,
): string | null {
  if (!attachment) {
    return null;
  }

  return attachment.mediaUrl?.trim() || null;
}

// ============================================================================
// IMAGES
// ============================================================================

export function isImageAttachment(
  attachment: Attachment | null | undefined,
): boolean {
  return getAttachmentCategory(getAttachmentMimeType(attachment)) === "image";
}

// ============================================================================
// VIDÉOS
// ============================================================================

export function isVideoAttachment(
  attachment: Attachment | null | undefined,
): boolean {
  return getAttachmentCategory(getAttachmentMimeType(attachment)) === "video";
}

// ============================================================================
// AUDIO
// ============================================================================

export function isAudioAttachment(
  attachment: Attachment | null | undefined,
): boolean {
  return getAttachmentCategory(getAttachmentMimeType(attachment)) === "audio";
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export function isDocumentAttachment(
  attachment: Attachment | null | undefined,
): boolean {
  return (
    getAttachmentCategory(getAttachmentMimeType(attachment)) === "document"
  );
}

// ============================================================================
// TAILLE
// ============================================================================

export function formatAttachmentSize(bytes: number | null | undefined): string {
  if (
    bytes === null ||
    bytes === undefined ||
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];

  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const decimals = value >= 10 ? 0 : 1;

  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

// ============================================================================
// EXTENSION
// ============================================================================

export function getFileExtension(fileName?: string | null): string {
  if (!fileName) {
    return "";
  }

  const cleanName = fileName.split(/[?#]/)[0].trim();

  const lastDot = cleanName.lastIndexOf(".");

  if (lastDot <= 0 || lastDot === cleanName.length - 1) {
    return "";
  }

  return cleanName.slice(lastDot + 1).toLowerCase();
}

// ============================================================================
// ICÔNE
// ============================================================================

export function getAttachmentIcon(
  attachment: Attachment | null | undefined,
): string {
  const category = getAttachmentCategory(getAttachmentMimeType(attachment));

  switch (category) {
    case "image":
      return "🖼️";

    case "video":
      return "🎬";

    case "audio":
      return "🎵";

    case "document":
      return "📄";

    default:
      return "📎";
  }
}

// ============================================================================
// NOM
// ============================================================================

export function getAttachmentName(
  attachment: Attachment | null | undefined,
): string {
  if (!attachment) {
    return "Fichier";
  }

  if (attachment.fileName?.trim()) {
    return attachment.fileName.trim();
  }

  const extension = getFileExtension(getAttachmentUrl(attachment));

  return extension ? `Fichier .${extension}` : "Fichier";
}

// ============================================================================
// URL
// ============================================================================

/**
 * Vérifie si un attachement possède une URL média exploitable.
 */
export function hasAttachmentUrl(
  attachment: Attachment | null | undefined,
): boolean {
  return Boolean(getAttachmentUrl(attachment));
}

// ============================================================================
// FILTRAGE — IMAGES
// ============================================================================

export function getImageAttachments(
  attachments: Attachment[] | null | undefined,
): Attachment[] {
  if (!attachments?.length) {
    return [];
  }

  return attachments.filter(isImageAttachment);
}

// ============================================================================
// FILTRAGE — VIDÉOS
// ============================================================================

export function getVideoAttachments(
  attachments: Attachment[] | null | undefined,
): Attachment[] {
  if (!attachments?.length) {
    return [];
  }

  return attachments.filter(isVideoAttachment);
}

// ============================================================================
// FILTRAGE — AUDIO
// ============================================================================

export function getAudioAttachments(
  attachments: Attachment[] | null | undefined,
): Attachment[] {
  if (!attachments?.length) {
    return [];
  }

  return attachments.filter(isAudioAttachment);
}

// ============================================================================
// FILTRAGE — DOCUMENTS
// ============================================================================

export function getDocumentAttachments(
  attachments: Attachment[] | null | undefined,
): Attachment[] {
  if (!attachments?.length) {
    return [];
  }

  return attachments.filter(isDocumentAttachment);
}

// ============================================================================
// FILTRAGE — MÉDIAS VISUELS
// ============================================================================

export function getVisualAttachments(
  attachments: Attachment[] | null | undefined,
): Attachment[] {
  if (!attachments?.length) {
    return [];
  }

  return attachments.filter(
    (attachment) =>
      isImageAttachment(attachment) || isVideoAttachment(attachment),
  );
}

// ============================================================================
// FILTRAGE — MÉDIAS
// ============================================================================

export function getMediaAttachments(
  attachments: Attachment[] | null | undefined,
): Attachment[] {
  if (!attachments?.length) {
    return [];
  }

  return attachments.filter(
    (attachment) =>
      isImageAttachment(attachment) ||
      isVideoAttachment(attachment) ||
      isAudioAttachment(attachment),
  );
}

// ============================================================================
// CATÉGORIE
// ============================================================================

export function getAttachmentType(
  attachment: Attachment | null | undefined,
): AttachmentCategory {
  return getAttachmentCategory(getAttachmentMimeType(attachment));
}

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidAttachment(
  attachment: Attachment | null | undefined,
): attachment is Attachment {
  return Boolean(attachment && attachment.fileId && attachment.fileName);
}
