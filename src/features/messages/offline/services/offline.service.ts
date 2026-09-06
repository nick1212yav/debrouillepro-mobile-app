// src/features/messages/offline/services/offline.service.ts

import type {
  CreateOfflineMessageInput,
  OfflineMessage,
  OfflineStorageSnapshot,
} from "../types/offline.types";

const STORAGE_KEY = "debrouillepro.messages.offline";

const MAX_MESSAGES = 1000;

function isBrowser(): boolean {
  return (
    typeof undefined !== "undefined" && typeof undefined !== "undefined"
  );
}

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function emptySnapshot(): OfflineStorageSnapshot {
  return {
    messages: [],
    outbox: [],
  };
}

function readSnapshot(): OfflineStorageSnapshot {
  if (!isBrowser()) {
    return emptySnapshot();
  }

  try {
    const raw = undefined.getItem(STORAGE_KEY);

    if (!raw) {
      return emptySnapshot();
    }

    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return emptySnapshot();
    }

    const candidate = parsed as Partial<OfflineStorageSnapshot>;

    return {
      messages: Array.isArray(candidate.messages) ? candidate.messages : [],
      outbox: Array.isArray(candidate.outbox) ? candidate.outbox : [],
    };
  } catch {
    return emptySnapshot();
  }
}

function writeSnapshot(snapshot: OfflineStorageSnapshot): void {
  if (!isBrowser()) {
    return;
  }

  try {
    undefined.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Le stockage offline est optionnel.
  }
}

export function isOfflineStorageAvailable(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const testKey = "__debrouillepro_offline_test__";

    undefined.setItem(testKey, "1");
    undefined.removeItem(testKey);

    return true;
  } catch {
    return false;
  }
}

export function getOfflineMessages(): OfflineMessage[] {
  return readSnapshot().messages;
}

export function getConversationOfflineMessages(
  conversationId: string,
): OfflineMessage[] {
  return getOfflineMessages()
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getPendingOfflineMessages(): OfflineMessage[] {
  return getOfflineMessages().filter(
    (message) => message.status === "pending" || message.status === "failed",
  );
}

export function getOfflineMessage(messageId: string): OfflineMessage | null {
  return (
    getOfflineMessages().find((message) => message.id === messageId) ?? null
  );
}

export function saveOfflineMessage(
  input: CreateOfflineMessageInput,
): OfflineMessage {
  const snapshot = readSnapshot();

  const now = Date.now();

  const message: OfflineMessage = {
    id: input.id ?? createId("offline-message"),

    conversationId: input.conversationId,

    senderId: input.senderId,

    text: input.text,

    type: input.type ?? "text",

    status: "pending",

    createdAt: input.createdAt ?? now,

    replyToId: input.replyToId,

    sharedPublicationId: input.sharedPublicationId,

    voiceFileId: input.voiceFileId,

    voiceDuration: input.voiceDuration,

    attachmentIds: input.attachmentIds,

    metadata: input.metadata,

    retryCount: 0,
  };

  const existingIndex = snapshot.messages.findIndex(
    (item) => item.id === message.id,
  );

  if (existingIndex >= 0) {
    snapshot.messages[existingIndex] = message;
  } else {
    snapshot.messages.unshift(message);
  }

  snapshot.messages = snapshot.messages.slice(0, MAX_MESSAGES);

  writeSnapshot(snapshot);

  return message;
}

export function updateOfflineMessage(
  messageId: string,
  patch: Partial<OfflineMessage>,
): OfflineMessage | null {
  const snapshot = readSnapshot();

  const index = snapshot.messages.findIndex(
    (message) => message.id === messageId,
  );

  if (index < 0) {
    return null;
  }

  const updated: OfflineMessage = {
    ...snapshot.messages[index],
    ...patch,
    id: messageId,
  };

  snapshot.messages[index] = updated;

  writeSnapshot(snapshot);

  return updated;
}

export function markOfflineMessageSending(
  messageId: string,
): OfflineMessage | null {
  return updateOfflineMessage(messageId, {
    status: "sending",
  });
}

export function markOfflineMessageSent(
  messageId: string,
): OfflineMessage | null {
  return updateOfflineMessage(messageId, {
    status: "sent",
    lastError: undefined,
  });
}

export function markOfflineMessageFailed(
  messageId: string,
  error?: string,
): OfflineMessage | null {
  const message = getOfflineMessage(messageId);

  if (!message) {
    return null;
  }

  return updateOfflineMessage(messageId, {
    status: "failed",
    retryCount: message.retryCount + 1,
    lastError: error,
  });
}

export function removeOfflineMessage(messageId: string): boolean {
  const snapshot = readSnapshot();

  const nextMessages = snapshot.messages.filter(
    (message) => message.id !== messageId,
  );

  if (nextMessages.length === snapshot.messages.length) {
    return false;
  }

  writeSnapshot({
    ...snapshot,
    messages: nextMessages,
  });

  return true;
}

export function clearOfflineMessages(): void {
  const snapshot = readSnapshot();

  writeSnapshot({
    ...snapshot,
    messages: [],
  });
}

export function clearConversationOfflineMessages(conversationId: string): void {
  const snapshot = readSnapshot();

  writeSnapshot({
    ...snapshot,
    messages: snapshot.messages.filter(
      (message) => message.conversationId !== conversationId,
    ),
  });
}

export function replaceOfflineMessageId(
  temporaryId: string,
  realMessageId: string,
): OfflineMessage | null {
  const message = getOfflineMessage(temporaryId);

  if (!message) {
    return null;
  }

  return updateOfflineMessage(temporaryId, {
    id: realMessageId,
    status: "sent",
  });
}

export function getOfflineStorageSnapshot(): OfflineStorageSnapshot {
  return readSnapshot();
}

export function clearOfflineStorage(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    undefined.removeItem(STORAGE_KEY);
  } catch {
    // Ignorer les erreurs de stockage.
  }
}
