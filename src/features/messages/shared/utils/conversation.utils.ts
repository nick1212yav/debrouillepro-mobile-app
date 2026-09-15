// src/features/messages/shared/utils/conversation.utils.ts

import type {
  Conversation,
  ConversationId,
  ConversationParticipant,
  ConversationType,
  UserId,
} from "../../types";

// ============================================================================
// NOM D'AFFICHAGE
// ============================================================================

/**
 * Retourne le nom d'affichage d'une conversation.
 *
 * Pour un groupe :
 *   groupName → "Groupe"
 *
 * Pour une conversation privée :
 *   le nom doit être fourni par le participant enrichi lorsque disponible.
 *
 * IMPORTANT :
 * `Conversation` ne contient pas directement `participants`,
 * `name` ou `avatar`.
 */
export function getConversationDisplayName(
  conversation: Conversation | null | undefined,
  currentUserId?: string,
  otherParticipant?: ConversationParticipant | null,
): string {
  if (!conversation) {
    return "Conversation";
  }

  if (conversation.isGroup) {
    return conversation.groupName?.trim() || "Groupe";
  }

  if (otherParticipant?.name && otherParticipant.name.trim().length > 0) {
    return otherParticipant.name.trim();
  }

  return "Conversation";
}

// ============================================================================
// AVATAR
// ============================================================================

/**
 * Retourne l'avatar d'affichage d'une conversation.
 *
 * Pour un groupe :
 *   groupAvatar
 *
 * Pour une conversation privée :
 *   avatar du participant opposé.
 */
export function getConversationAvatar(
  conversation: Conversation | null | undefined,
  currentUserId?: string,
  otherParticipant?: ConversationParticipant | null,
): string | null {
  if (!conversation) {
    return null;
  }

  if (conversation.isGroup) {
    return conversation.groupAvatar ?? null;
  }

  return otherParticipant?.avatar ?? null;
}

// ============================================================================
// TYPE DE CONVERSATION
// ============================================================================

export function getConversationType(
  conversation: Conversation | null | undefined,
): ConversationType {
  if (!conversation) {
    return "private";
  }

  return conversation.isGroup ? "group" : "private";
}

// ============================================================================
// GROUPE / PRIVÉE
// ============================================================================

export function isGroupConversation(
  conversation: Conversation | null | undefined,
): boolean {
  return Boolean(conversation?.isGroup);
}

export function isPrivateConversation(
  conversation: Conversation | null | undefined,
): boolean {
  return Boolean(conversation && !conversation.isGroup);
}

// ============================================================================
// PARTICIPANTS
// ============================================================================

/**
 * Retourne le nombre de participants connus dans le document conversation.
 *
 * `participantIds` est la source disponible dans le document Convex.
 */
export function getParticipantCount(
  conversation: Conversation | null | undefined,
): number {
  if (!conversation) {
    return 0;
  }

  return conversation.participantIds.length;
}

// ============================================================================
// PARTICIPANT
// ============================================================================

/**
 * Vérifie si un utilisateur appartient à la conversation
 * à partir des participantIds disponibles dans le document.
 */
export function isConversationParticipant(
  conversation: Conversation | null | undefined,
  userId: string | UserId | null | undefined,
): boolean {
  if (!conversation || !userId) {
    return false;
  }

  return conversation.participantIds.some(
    (participantId) => participantId === userId,
  );
}

// ============================================================================
// AUTRE PARTICIPANT
// ============================================================================

/**
 * Retourne l'ID de l'autre participant d'une conversation privée.
 *
 * Les informations de profil doivent être récupérées séparément.
 */
export function getOtherParticipantId(
  conversation: Conversation | null | undefined,
  currentUserId?: string | UserId,
): UserId | null {
  if (!conversation || conversation.isGroup || !currentUserId) {
    return null;
  }

  const otherParticipant = conversation.participantIds.find(
    (participantId) => participantId !== currentUserId,
  );

  return otherParticipant ?? null;
}

/**
 * Retourne le participant enrichi fourni par le service/hook.
 *
 * Cette fonction permet de conserver une API simple pour les composants.
 */
export function getOtherParticipant(
  conversation: Conversation | null | undefined,
  currentUserId?: string | UserId,
  otherParticipant?: ConversationParticipant | null,
): ConversationParticipant | null {
  if (!conversation || conversation.isGroup) {
    return null;
  }

  if (otherParticipant) {
    return otherParticipant;
  }

  const otherParticipantId = getOtherParticipantId(conversation, currentUserId);

  if (!otherParticipantId) {
    return null;
  }

  return {
    _id: otherParticipantId,
  };
}

// ============================================================================
// MESSAGES NON LUS
// ============================================================================

/**
 * Le nombre de messages non lus appartient au membership utilisateur,
 * pas au document `conversations`.
 *
 * Il doit donc être fourni par le hook/service.
 */
export function getUnreadCount(
  _conversation: Conversation | null | undefined,
  unreadCount?: number | null,
): number {
  return Math.max(0, Math.floor(unreadCount ?? 0));
}

export function hasUnreadMessages(
  conversation: Conversation | null | undefined,
  unreadCount?: number | null,
): boolean {
  return getUnreadCount(conversation, unreadCount) > 0;
}

// ============================================================================
// FORMATAGE DU COMPTEUR NON LU
// ============================================================================

export function formatUnreadCount(count: number | null | undefined): string {
  const safeCount = Math.max(0, Math.floor(count ?? 0));

  if (safeCount === 0) {
    return "";
  }

  if (safeCount > 99) {
    return "99+";
  }

  return String(safeCount);
}

// ============================================================================
// DERNIER MESSAGE
// ============================================================================

export function getLastMessagePreview(
  conversation: Conversation | null | undefined,
  maxLength = 80,
): string {
  if (!conversation?.lastMessageText) {
    return "";
  }

  const text = conversation.lastMessageText.trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

// ============================================================================
// DERNIER EXPÉDITEUR
// ============================================================================

export function getLastMessageSenderId(
  conversation: Conversation | null | undefined,
): UserId | null {
  if (!conversation) {
    return null;
  }

  return conversation.lastMessageSenderId ?? null;
}

// ============================================================================
// DATE DE MISE À JOUR
// ============================================================================

export function getConversationUpdatedAt(
  conversation: Conversation | null | undefined,
): string | null {
  if (!conversation) {
    return null;
  }

  return conversation.updatedAt ?? null;
}

// ============================================================================
// IDENTIFIANT
// ============================================================================

export function getConversationId(
  conversation: Conversation | null | undefined,
): ConversationId | null {
  return conversation?._id ?? null;
}

// ============================================================================
// VIEW MODEL
// ============================================================================

/**
 * Construit le modèle d'affichage utilisé par les composants.
 *
 * Les données qui ne sont pas stockées dans `conversations`
 * sont explicitement injectées ici.
 */
export function toConversationViewModel(
  conversation: Conversation,
  options?: {
    currentUserId?: string | UserId;
    otherParticipant?: ConversationParticipant | null;
    unreadCount?: number | null;
  },
) {
  const otherParticipant = options?.otherParticipant ?? null;

  return {
    conversationId: conversation._id,

    isGroup: conversation.isGroup,

    name: getConversationDisplayName(
      conversation,
      options?.currentUserId,
      otherParticipant,
    ),

    avatar: getConversationAvatar(
      conversation,
      options?.currentUserId,
      otherParticipant,
    ),

    lastMessageText: getLastMessagePreview(conversation),

    lastMessageSenderId: conversation.lastMessageSenderId ?? undefined,

    updatedAt: conversation.updatedAt,

    unreadCount: getUnreadCount(conversation, options?.unreadCount),

    otherParticipant,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidConversation(
  conversation: Conversation | null | undefined,
): conversation is Conversation {
  return Boolean(
    conversation &&
    conversation._id &&
    Array.isArray(conversation.participantIds),
  );
}
