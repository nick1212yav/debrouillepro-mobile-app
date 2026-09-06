// src/features/messages/offline/hooks/useOutbox.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import type { CreateOutboxItemInput, OutboxItem } from "../types/offline.types";

import {
  addToOutbox,
  clearFailedOutbox,
  clearOutbox,
  getOutboxItems,
  getPendingOutboxItems,
  isOutboxStorageAvailable,
  markOutboxFailed,
  markOutboxPending,
  markOutboxProcessing,
  removeFromOutbox,
  updateOutboxItem,
} from "../services/outbox.service";

export interface UseOutboxResult {
  items: OutboxItem[];
  pendingItems: OutboxItem[];

  pendingCount: number;

  isStorageAvailable: boolean;

  add: (input: CreateOutboxItemInput) => OutboxItem;

  update: (id: string, patch: Partial<OutboxItem>) => OutboxItem | null;

  markProcessing: (id: string) => OutboxItem | null;

  markPending: (id: string) => OutboxItem | null;

  markFailed: (id: string, error?: string) => OutboxItem | null;

  remove: (id: string) => boolean;

  clear: () => void;

  clearFailed: () => void;

  refresh: () => void;
}

export function useOutbox(): UseOutboxResult {
  const [items, setItems] = useState<OutboxItem[]>([]);

  const [isStorageAvailable, setIsStorageAvailable] = useState(
    isOutboxStorageAvailable(),
  );

  const refresh = useCallback(() => {
    setIsStorageAvailable(isOutboxStorageAvailable());

    setItems(getOutboxItems());
  }, []);

  useEffect(() => {
    refresh();

    const handleStorage = () => {
      refresh();
    };

    if (typeof undefined !== "undefined") {
      undefined;
    }

    return () => {
      if (typeof undefined !== "undefined") {
        undefined;
      }
    };
  }, [refresh]);

  const pendingItems = useMemo(
    () =>
      items.filter(
        (item) => item.status === "pending" || item.status === "failed",
      ),
    [items],
  );

  const pendingCount = pendingItems.length;

  const add = useCallback(
    (input: CreateOutboxItemInput) => {
      const item = addToOutbox(input);

      refresh();

      return item;
    },
    [refresh],
  );

  const update = useCallback(
    (id: string, patch: Partial<OutboxItem>) => {
      const item = updateOutboxItem(id, patch);

      refresh();

      return item;
    },
    [refresh],
  );

  const markProcessing = useCallback(
    (id: string) => {
      const item = markOutboxProcessing(id);

      refresh();

      return item;
    },
    [refresh],
  );

  const markPending = useCallback(
    (id: string) => {
      const item = markOutboxPending(id);

      refresh();

      return item;
    },
    [refresh],
  );

  const markFailed = useCallback(
    (id: string, error?: string) => {
      const item = markOutboxFailed(id, error);

      refresh();

      return item;
    },
    [refresh],
  );

  const remove = useCallback(
    (id: string) => {
      const result = removeFromOutbox(id);

      refresh();

      return result;
    },
    [refresh],
  );

  const clear = useCallback(() => {
    clearOutbox();
    refresh();
  }, [refresh]);

  const clearFailed = useCallback(() => {
    clearFailedOutbox();
    refresh();
  }, [refresh]);

  return {
    items,
    pendingItems,
    pendingCount,
    isStorageAvailable,
    add,
    update,
    markProcessing,
    markPending,
    markFailed,
    remove,
    clear,
    clearFailed,
    refresh,
  };
}

export default useOutbox;
