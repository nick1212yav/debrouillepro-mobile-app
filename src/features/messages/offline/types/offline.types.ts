// src/features/messages/offline/types/offline.types.ts

export type OfflineMessageStatus = "pending" | "sending" | "sent" | "failed";

export type OutboxOperationType =
  | "send_message"
  | "edit_message"
  | "delete_message"
  | "send_reaction"
  | "remove_reaction"
  | "mark_as_read"
  | "send_voice"
  | "send_attachment"
  | "forward_message"
  | "create_poll"
  | "send_location";

export interface OfflineMessage {
  id: string;
  conversationId: string;
  senderId: string;

  text: string;

  type:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "voice"
    | "file"
    | "location"
    | "contact"
    | "publication"
    | "system";

  status: OfflineMessageStatus;

  createdAt: number;

  replyToId?: string;
  sharedPublicationId?: string;

  voiceFileId?: string;
  voiceDuration?: number;

  attachmentIds?: string[];

  metadata?: Record<string, unknown>;

  retryCount: number;

  lastError?: string;
}

export interface CreateOfflineMessageInput {
  id?: string;
  conversationId: string;
  senderId: string;

  text: string;

  type?: OfflineMessage["type"];

  replyToId?: string;
  sharedPublicationId?: string;

  voiceFileId?: string;
  voiceDuration?: number;

  attachmentIds?: string[];

  metadata?: Record<string, unknown>;

  createdAt?: number;
}

export interface OutboxItem {
  id: string;

  type: OutboxOperationType;

  conversationId?: string;
  messageId?: string;

  payload: Record<string, unknown>;

  createdAt: number;
  updatedAt: number;

  status: "pending" | "processing" | "failed";

  retryCount: number;

  lastError?: string;
}

export interface CreateOutboxItemInput {
  id?: string;

  type: OutboxOperationType;

  conversationId?: string;
  messageId?: string;

  payload?: Record<string, unknown>;
}

export interface OfflineStorageSnapshot {
  messages: OfflineMessage[];
  outbox: OutboxItem[];
}

export interface OfflineState {
  isOnline: boolean;
  isStorageAvailable: boolean;

  messages: OfflineMessage[];
  pendingMessages: OfflineMessage[];

  outbox: OutboxItem[];
  pendingOutbox: OutboxItem[];

  lastSyncAt: number | null;
}
