// src/features/messages/offline/services/outbox.service.ts

import type {
  CreateOutboxItemInput,
  OutboxItem,
  OutboxOperationType,
} from "../types/offline.types";

const STORAGE_KEY = "debrouillepro.messages.outbox";

const MAX_OUTBOX_ITEMS = 500;

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `outbox-${crypto.randomUUID()}`;
  }

  return `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readItems(): OutboxItem[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as OutboxItem[];
  } catch {
    return [];
  }
}

function writeItems(items: OutboxItem[]): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Le stockage offline est optionnel.
  }
}

export function getOutboxItems(): OutboxItem[] {
  return readItems().sort((a, b) => a.createdAt - b.createdAt);
}

export function getPendingOutboxItems(): OutboxItem[] {
  return getOutboxItems().filter(
    (item) => item.status === "pending" || item.status === "failed",
  );
}

export function getOutboxItem(id: string): OutboxItem | null {
  return getOutboxItems().find((item) => item.id === id) ?? null;
}

export function addToOutbox(input: CreateOutboxItemInput): OutboxItem {
  const items = readItems();

  const now = Date.now();

  const item: OutboxItem = {
    id: input.id ?? createId(),

    type: input.type,

    conversationId: input.conversationId,

    messageId: input.messageId,

    payload: input.payload ?? {},

    createdAt: now,
    updatedAt: now,

    status: "pending",

    retryCount: 0,
  };

  items.push(item);

  writeItems(items.slice(-MAX_OUTBOX_ITEMS));

  return item;
}

export function updateOutboxItem(
  id: string,
  patch: Partial<OutboxItem>,
): OutboxItem | null {
  const items = readItems();

  const index = items.findIndex((item) => item.id === id);

  if (index < 0) {
    return null;
  }

  const updated: OutboxItem = {
    ...items[index],
    ...patch,
    id,
    updatedAt: Date.now(),
  };

  items[index] = updated;

  writeItems(items);

  return updated;
}

export function markOutboxProcessing(id: string): OutboxItem | null {
  return updateOutboxItem(id, {
    status: "processing",
  });
}

export function markOutboxPending(id: string): OutboxItem | null {
  return updateOutboxItem(id, {
    status: "pending",
    lastError: undefined,
  });
}

export function markOutboxFailed(
  id: string,
  error?: string,
): OutboxItem | null {
  const item = getOutboxItem(id);

  if (!item) {
    return null;
  }

  return updateOutboxItem(id, {
    status: "failed",
    retryCount: item.retryCount + 1,
    lastError: error,
  });
}

export function removeFromOutbox(id: string): boolean {
  const items = readItems();

  const nextItems = items.filter((item) => item.id !== id);

  if (nextItems.length === items.length) {
    return false;
  }

  writeItems(nextItems);

  return true;
}

export function removeOutboxItemsByMessageId(messageId: string): number {
  const items = readItems();

  const nextItems = items.filter((item) => item.messageId !== messageId);

  const removed = items.length - nextItems.length;

  if (removed > 0) {
    writeItems(nextItems);
  }

  return removed;
}

export function clearOutbox(): void {
  writeItems([]);
}

export function clearFailedOutbox(): void {
  const items = readItems();

  writeItems(items.filter((item) => item.status !== "failed"));
}

export function countPendingOutbox(): number {
  return getPendingOutboxItems().length;
}

export function countOutboxItems(): number {
  return readItems().length;
}

export function hasPendingOutbox(): boolean {
  return countPendingOutbox() > 0;
}

export function findOutboxItemForMessage(messageId: string): OutboxItem | null {
  return getOutboxItems().find((item) => item.messageId === messageId) ?? null;
}

export function findOutboxItemsByType(type: OutboxOperationType): OutboxItem[] {
  return getOutboxItems().filter((item) => item.type === type);
}

export function isOutboxStorageAvailable(): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    const testKey = "__debrouillepro_outbox_test__";

    window.localStorage.setItem(testKey, "1");

    window.localStorage.removeItem(testKey);

    return true;
  } catch {
    return false;
  }
}
