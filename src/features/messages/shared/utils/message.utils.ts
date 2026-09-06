// src/features/messages/shared/utils/message.utils.ts

import type { MessageStatus, MessageType, Reaction } from "../../types";

/**
 * Retourne les initiales d'un nom.
 */
export function getInitials(name?: string | null, fallback = "?"): string {
  if (!name?.trim()) {
    return fallback;
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

/**
 * Tronque un texte sans couper inutilement les mots.
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
): string {
  if (!text) {
    return "";
  }

  if (maxLength <= 0) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, Math.max(0, maxLength - 1)).trimEnd();

  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > Math.floor(truncated.length * 0.6)) {
    return `${truncated.slice(0, lastSpace)}…`;
  }

  return `${truncated}…`;
}

/**
 * Vérifie si un message contient réellement du texte.
 */
export function hasMessageText(text: string | null | undefined): boolean {
  return Boolean(text?.trim());
}

/**
 * Retourne un libellé utilisateur pour le type de message.
 */
export function getMessageTypeLabel(type: MessageType): string {
  const labels: Record<MessageType, string> = {
    text: "Message",
    image: "Image",
    video: "Vidéo",
    audio: "Audio",
    voice: "Message vocal",
    file: "Fichier",
    location: "Localisation",
    contact: "Contact",
    publication: "Publication",
    system: "Système",
  };

  return labels[type];
}

/**
 * Retourne une icône simple pour le type de message.
 */
export function getMessageTypeIcon(type: MessageType): string {
  const icons: Record<MessageType, string> = {
    text: "💬",
    image: "🖼️",
    video: "🎬",
    audio: "🎵",
    voice: "🎤",
    file: "📎",
    location: "📍",
    contact: "👤",
    publication: "📰",
    system: "ℹ️",
  };

  return icons[type];
}

/**
 * Retourne le libellé d'un statut de message.
 */
export function getMessageStatusLabel(status: MessageStatus): string {
  const labels: Record<MessageStatus, string> = {
    sent: "Envoyé",
    delivered: "Distribué",
    read: "Lu",
    failed: "Échec de l'envoi",
  };

  return labels[status];
}

/**
 * Retourne le nombre total de réactions.
 */
export function getReactionCount(reactions?: Reaction[] | null): number {
  if (!reactions?.length) {
    return 0;
  }

  return reactions.reduce(
    (total, reaction) => total + Math.max(0, reaction.count),
    0,
  );
}

/**
 * Vérifie si un message possède des réactions.
 */
export function hasReactions(reactions?: Reaction[] | null): boolean {
  return getReactionCount(reactions) > 0;
}

/**
 * Vérifie si une réaction précise existe.
 */
export function hasReaction(
  reactions: Reaction[] | null | undefined,
  emoji: string,
): boolean {
  if (!reactions?.length || !emoji) {
    return false;
  }

  return reactions.some(
    (reaction) => reaction.emoji === emoji && reaction.count > 0,
  );
}

/**
 * Formate une durée en secondes sous forme mm:ss.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (
    seconds === null ||
    seconds === undefined ||
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Formate une taille de fichier.
 */
export function formatFileSize(bytes: number | null | undefined): string {
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

/**
 * Nettoie un texte avant affichage.
 */
export function normalizeMessageText(text: string | null | undefined): string {
  if (!text) {
    return "";
  }

  return text.replace(/\r\n/g, "\n").trim();
}

/**
 * Détermine si un message peut être édité.
 */
export function canEditMessage(params: {
  isOwnMessage: boolean;
  type: MessageType;
  isDeleted?: boolean;
}): boolean {
  if (!params.isOwnMessage) {
    return false;
  }

  if (params.isDeleted) {
    return false;
  }

  return params.type === "text";
}

/**
 * Détermine si un message peut être supprimé.
 */
export function canDeleteMessage(params: {
  isOwnMessage: boolean;
  isDeleted?: boolean;
}): boolean {
  return params.isOwnMessage && !params.isDeleted;
}

/**
 * Détermine si un message peut recevoir une réponse.
 */
export function canReplyToMessage(isDeleted?: boolean): boolean {
  return !isDeleted;
}

/**
 * Détermine si un message peut être transféré.
 */
export function canForwardMessage(isDeleted?: boolean): boolean {
  return !isDeleted;
}
