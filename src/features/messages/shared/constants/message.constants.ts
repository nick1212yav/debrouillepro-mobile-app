// src/features/messages/shared/constants/message.constants.ts

import type { MessageStatus, MessageType, PresenceStatus } from "../../types";

// ============================================================================
// TYPES DE MESSAGES
// ============================================================================

export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  VOICE: "voice",
  FILE: "file",
  LOCATION: "location",
  CONTACT: "contact",
  PUBLICATION: "publication",
  SYSTEM: "system",
} as const satisfies Record<string, MessageType>;

export const MESSAGE_TYPE_VALUES: readonly MessageType[] = [
  "text",
  "image",
  "video",
  "audio",
  "voice",
  "file",
  "location",
  "contact",
  "publication",
  "system",
];

// ============================================================================
// STATUTS DES MESSAGES
// ============================================================================

export const MESSAGE_STATUS = {
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
} as const satisfies Record<string, MessageStatus>;

export const MESSAGE_STATUS_VALUES: readonly MessageStatus[] = [
  "sent",
  "delivered",
  "read",
  "failed",
];

// ============================================================================
// PRÉSENCE
// ============================================================================

export const PRESENCE_STATUS = {
  ONLINE: "online",
  AWAY: "away",
  OFFLINE: "offline",
} as const satisfies Record<string, PresenceStatus>;

export const PRESENCE_STATUS_VALUES: readonly PresenceStatus[] = [
  "online",
  "away",
  "offline",
];

// ============================================================================
// TYPING
// ============================================================================

/**
 * Valeurs utilisées par le système de saisie.
 *
 * IMPORTANT :
 * `UserTypingStatus` dans le projet actuel n'est pas un union compatible
 * directement avec `string`. On conserve donc ici les valeurs runtime
 * comme des littéraux indépendants.
 */
export const TYPING_STATUS = {
  TYPING: "typing",
  RECORDING: "recording",
  IDLE: "idle",
} as const;

export const TYPING_STATUS_VALUES = [
  TYPING_STATUS.TYPING,
  TYPING_STATUS.RECORDING,
  TYPING_STATUS.IDLE,
] as const;

// ============================================================================
// LIMITES
// ============================================================================

export const MESSAGE_LIMITS = {
  MAX_TEXT_LENGTH: 10_000,
  MAX_REPLY_PREVIEW_LENGTH: 300,
  MAX_SEARCH_QUERY_LENGTH: 200,
  MAX_REACTION_LENGTH: 32,

  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,

  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  MAX_FILE_SIZE_BYTES: 100 * 1024 * 1024,

  MAX_VOICE_DURATION_SECONDS: 60 * 60,
} as const;

// ============================================================================
// PAGINATION
// ============================================================================

export const MESSAGE_PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

// ============================================================================
// INTERVALLES
// ============================================================================

export const MESSAGE_TIMINGS = {
  TYPING_TIMEOUT_MS: 3_000,
  TYPING_DEBOUNCE_MS: 500,

  PRESENCE_REFRESH_MS: 30_000,

  SEARCH_DEBOUNCE_MS: 300,

  READ_RECEIPT_DEBOUNCE_MS: 500,

  VOICE_METER_INTERVAL_MS: 100,

  UI_MESSAGE_GROUPING_MS: 5 * 60 * 1000,
} as const;

// ============================================================================
// RÉACTIONS
// ============================================================================

export const DEFAULT_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

export const MAX_REACTIONS_PER_MESSAGE = 20;

// ============================================================================
// FICHIERS / MÉDIAS
// ============================================================================

export const MEDIA_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],

  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],

  AUDIO: [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/mp4",
  ],

  DOCUMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ],
} as const;

export const MEDIA_ACCEPT = [
  ...MEDIA_MIME_TYPES.IMAGE,
  ...MEDIA_MIME_TYPES.VIDEO,
  ...MEDIA_MIME_TYPES.AUDIO,
  ...MEDIA_MIME_TYPES.DOCUMENT,
].join(",");

// ============================================================================
// MESSAGES SYSTÈME
// ============================================================================

export const SYSTEM_MESSAGE_TEXT = {
  GROUP_CREATED: "Groupe créé",
  GROUP_MEMBER_ADDED: "Membre ajouté",
  GROUP_MEMBER_REMOVED: "Membre retiré",
  MEMBER_LEFT: "Membre a quitté le groupe",
  MESSAGE_DELETED: "Message supprimé",
} as const;

// ============================================================================
// AFFICHAGE
// ============================================================================

export const MESSAGE_DISPLAY = {
  MAX_PREVIEW_TEXT_LENGTH: 120,
  MAX_CONVERSATION_NAME_LENGTH: 80,

  DATE_SEPARATOR_THRESHOLD_MS: 24 * 60 * 60 * 1000,

  MESSAGE_GROUPING_THRESHOLD_MS: 5 * 60 * 1000,
} as const;

// ============================================================================
// COMPOSER
// ============================================================================

export const COMPOSER = {
  MAX_TEXT_LENGTH: MESSAGE_LIMITS.MAX_TEXT_LENGTH,

  MAX_ATTACHMENTS: MESSAGE_LIMITS.MAX_ATTACHMENTS_PER_MESSAGE,

  ENTER_SENDS_MESSAGE: true,
  SHIFT_ENTER_NEW_LINE: true,
} as const;

// ============================================================================
// ERREURS
// ============================================================================

export const MESSAGE_ERRORS = {
  MESSAGE_NOT_FOUND: "Message introuvable",
  CONVERSATION_NOT_FOUND: "Conversation introuvable",
  NOT_AUTHORIZED: "Non autorisé",

  EMPTY_MESSAGE: "Le message ne peut pas être vide",

  MESSAGE_TOO_LONG: "Le message est trop long",

  FILE_TOO_LARGE: "Le fichier est trop volumineux",

  INVALID_FILE_TYPE: "Type de fichier non pris en charge",

  VOICE_TOO_LONG: "Le message vocal est trop long",

  SEND_FAILED: "Impossible d'envoyer le message",
} as const;

// ============================================================================
// LIBELLÉS UI
// ============================================================================

export const MESSAGE_LABELS = {
  TEXT: "Message",
  IMAGE: "Image",
  VIDEO: "Vidéo",
  AUDIO: "Audio",
  VOICE: "Message vocal",
  FILE: "Fichier",
  LOCATION: "Localisation",
  CONTACT: "Contact",
  PUBLICATION: "Publication",
  SYSTEM: "Système",

  SENT: "Envoyé",
  DELIVERED: "Distribué",
  READ: "Lu",
  FAILED: "Échec",
} as const;

// ============================================================================
// HELPERS
// ============================================================================

export function isValidMessageType(value: string): value is MessageType {
  return MESSAGE_TYPE_VALUES.includes(value as MessageType);
}

export function isValidMessageStatus(value: string): value is MessageStatus {
  return MESSAGE_STATUS_VALUES.includes(value as MessageStatus);
}

export function isValidPresenceStatus(value: string): value is PresenceStatus {
  return PRESENCE_STATUS_VALUES.includes(value as PresenceStatus);
}

/**
 * Vérifie une valeur runtime sans prétendre que `UserTypingStatus`
 * est lui-même un type string.
 */
export function isValidTypingStatus(value: string): boolean {
  return (
    value === TYPING_STATUS.TYPING ||
    value === TYPING_STATUS.RECORDING ||
    value === TYPING_STATUS.IDLE
  );
}
