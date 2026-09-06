// src/features/messages/types.ts

import type { Doc, Id } from "../../../convex/_generated/dataModel";

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type MessageId = Id<"messages">;
export type ConversationId = Id<"conversations">;
export type UserId = Id<"users">;
export type PublicationId = Id<"publications">;
export type StorageId = Id<"_storage">;

export type ConversationMemberId = Id<"conversationMembers">;
export type AttachmentId = Id<"attachments">;
export type ReadReceiptId = Id<"readReceipts">;
export type TypingIndicatorId = Id<"typingIndicators">;
export type PresenceId = Id<"presence">;

// ============================================================================
// MESSAGE
// ============================================================================

export type Message = Doc<"messages">;

/**
 * Le type réel du message est dérivé du schéma Convex.
 * Cela évite de maintenir deux contrats différents frontend/backend.
 */
export type MessageType = Message["type"];

export type MessageStatus = Message["status"];

/**
 * Réaction utilisée par le backend messages.
 *
 * Le backend retourne actuellement :
 * {
 *   emoji: string;
 *   count: number;
 * }
 */
export interface MessageReaction {
  emoji: string;
  count: number;
}

/**
 * Alias de compatibilité utilisé par message.utils.ts
 */
export type Reaction = MessageReaction;

// ============================================================================
// MESSAGE ENRICHI POUR L'UI
// ============================================================================

export interface MessageSender {
  _id: UserId;
  name?: string;
  avatar?: string;
}

export interface MessageWithSender extends Message {
  sender?: MessageSender | null;
}

// ============================================================================
// CONVERSATION
// ============================================================================

/**
 * Conversation = contrat réel Convex.
 *
 * IMPORTANT :
 * On ne rajoute pas ici participants/name/avatar/unreadCount.
 * Ces données ne font pas partie du document conversations actuel.
 */
export type Conversation = Doc<"conversations">;

export type ConversationType = Conversation["isGroup"] extends boolean
  ? "private" | "group"
  : never;

/**
 * Représentation enrichie construite côté frontend
 * lorsque l'UI a besoin des informations du membre.
 */
export interface ConversationMember {
  _id: ConversationMemberId;
  conversationId: ConversationId;
  userId: UserId;
  unreadCount: number;
  role?: "owner" | "admin" | "member";
  isMuted?: boolean;
  joinedAt?: number;
  lastReadAt?: number;
}

// ============================================================================
// PARTICIPANT
// ============================================================================

export interface ConversationParticipant {
  _id: UserId;
  name?: string;
  avatar?: string;
}

/**
 * Conversation enrichie pour les composants UI.
 *
 * On sépare volontairement cette structure du Doc<"conversations">.
 */
export interface ConversationWithParticipant {
  conversation: Conversation;
  member?: ConversationMember | null;
  otherParticipant?: ConversationParticipant | null;
}

// ============================================================================
// CONVERSATION VIEW MODEL
// ============================================================================

/**
 * Modèle destiné à l'affichage dans ConversationList / ConversationItem.
 *
 * Ces propriétés sont calculées par le frontend/service,
 * elles ne prétendent pas exister dans conversations.
 */
export interface ConversationViewModel {
  conversationId: ConversationId;

  isGroup: boolean;

  name: string;

  avatar: string | null;

  lastMessageText: string;

  lastMessageSenderId?: UserId;

  updatedAt: string;

  unreadCount: number;

  otherParticipant?: ConversationParticipant | null;
}

// ============================================================================
// RÉPONSE
// ============================================================================

export interface ReplyPreviewData {
  messageId: MessageId;
  senderId: UserId;
  senderName?: string;
  text: string;
  type: MessageType;
}

// ============================================================================
// TRANSFERT
// ============================================================================

export interface ForwardTarget {
  conversationId: ConversationId;
  isGroup: boolean;
  name: string;
  avatar: string | null;
  otherParticipant: ConversationParticipant | null;
}

// ============================================================================
// PIÈCES JOINTES
// ============================================================================

export interface MessageFile {
  fileId: StorageId | string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
}

export interface MessageAttachment {
  id: AttachmentId | string;
  fileId: StorageId | string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Alias de compatibilité pour attachment.utils.ts
 */
export type Attachment = MessageAttachment;

// ============================================================================
// VOCAL
// ============================================================================

export interface VoiceMessageData {
  fileId: StorageId;
  duration: number;
}

// ============================================================================
// LOCALISATION
// ============================================================================

export interface MessageLocation {
  latitude: number;
  longitude: number;
  address?: string;
  label?: string;
}

// ============================================================================
// CONTACT
// ============================================================================

export interface MessageContact {
  userId?: UserId;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

// ============================================================================
// COMPOSER
// ============================================================================

export interface MessageComposerState {
  text: string;
  replyToId?: MessageId;
  sharedPublicationId?: PublicationId;
}

export interface SendMessageInput {
  conversationId: ConversationId;
  text: string;
  replyToId?: MessageId;
  sharedPublicationId?: PublicationId;
}

// ============================================================================
// RECHERCHE
// ============================================================================

export interface MessageSearchFilters {
  query: string;
  type?: MessageType;
  senderId?: UserId;
  conversationId?: ConversationId;
  limit?: number;
}

/**
 * Résultat normalisé utilisé par les composants de recherche.
 */
export interface MessageSearchResult {
  messageId: MessageId;
  message: Message;
  sender?: MessageSender | null;
  conversation?: Conversation | null;
}

// ============================================================================
// PRÉSENCE
// ============================================================================

export type PresenceStatus = "online" | "away" | "offline";

export interface UserPresence {
  userId: UserId;
  status: PresenceStatus;
  lastSeen?: string | null;
  device?: string | null;
}

// ============================================================================
// TYPING
// ============================================================================

export interface UserTypingStatus {
  userId: UserId;
  conversationId: ConversationId;
  isTyping: boolean;
  lastActiveAt: number;
}

// ============================================================================
// READ RECEIPTS
// ============================================================================

export interface ReadReceipt {
  _id?: ReadReceiptId;
  messageId: MessageId;
  userId: UserId;
  readAt: string;
}

// ============================================================================
// PERMISSIONS
// ============================================================================

export type ConversationRole = "owner" | "admin" | "member";

export interface MessagePermissions {
  canSend: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
  canForward: boolean;
  canReact: boolean;
  canPin: boolean;
}

// ============================================================================
// CHAT
// ============================================================================

export interface ChatState {
  conversationId: ConversationId | null;

  replyingTo: Message | null;

  selectedMessageId: MessageId | null;

  isSearchOpen: boolean;

  isAttachmentPickerOpen: boolean;

  isEmojiPickerOpen: boolean;
}

// ============================================================================
// PAGINATION
// ============================================================================

export interface MessagePaginationState {
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
}

// ============================================================================
// ÉTAT D'ENVOI
// ============================================================================

export type MessageSendState = "idle" | "sending" | "sent" | "failed";

export interface PendingMessage {
  localId: string;
  conversationId: ConversationId;
  text: string;
  createdAt: number;
  state: MessageSendState;
  error?: string;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

// ============================================================================
// CALLS
// ============================================================================

export type CallType = "audio" | "video";

export type CallStatus =
  | "pending"
  | "ringing"
  | "active"
  | "ended"
  | "rejected"
  | "missed";

export interface CallParticipant {
  userId: UserId;
  name?: string;
  avatar?: string;
  isMuted?: boolean;
  isVideoEnabled?: boolean;
}

// ============================================================================
// POLLS
// ============================================================================

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollResult {
  optionId: string;
  text: string;
  votes: number;
  percentage?: number;
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  multipleChoice?: boolean;
  closed?: boolean;
}

// ============================================================================
// UTILITAIRES DE TYPE
// ============================================================================

export function isTextMessage(message: Message): boolean {
  return message.type === "text";
}

export function isVoiceMessage(message: Message): boolean {
  return message.type === "voice";
}

export function isMediaMessage(message: Message): boolean {
  return (
    message.type === "image" ||
    message.type === "video" ||
    message.type === "audio"
  );
}

export function isFileMessage(message: Message): boolean {
  return message.type === "file";
}

export function isLocationMessage(message: Message): boolean {
  return message.type === "location";
}

export function isContactMessage(message: Message): boolean {
  return message.type === "contact";
}

export function isPublicationMessage(message: Message): boolean {
  return message.type === "publication";
}

export function isSystemMessage(message: Message): boolean {
  return message.type === "system";
}

// ============================================================================
// HELPERS
// ============================================================================

export function isGroupConversation(conversation: Conversation): boolean {
  return conversation.isGroup;
}

export function isPrivateConversation(conversation: Conversation): boolean {
  return !conversation.isGroup;
}

export function getConversationDisplayName(conversation: Conversation): string {
  if (conversation.isGroup) {
    return conversation.groupName?.trim() || "Groupe";
  }

  return "Conversation";
}
