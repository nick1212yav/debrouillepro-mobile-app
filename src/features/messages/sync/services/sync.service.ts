// src/features/messages/sync/services/sync.service.ts

export type MessageSyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "error"
  | "offline";

export interface MessageSyncState {
  status: MessageSyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
}

export interface MessageSyncEvent {
  type:
    | "sync_started"
    | "sync_completed"
    | "sync_failed"
    | "connection_changed";

  timestamp: number;

  error?: string;

  online?: boolean;
}

type SyncListener = (state: MessageSyncState) => void;

const DEFAULT_STATE: MessageSyncState = {
  status: "idle",
  lastSyncedAt: null,
  error: null,
};

let state: MessageSyncState = {
  ...DEFAULT_STATE,
};

const listeners = new Set<SyncListener>();

function emit(): void {
  for (const listener of listeners) {
    listener({ ...state });
  }
}

function updateState(next: Partial<MessageSyncState>): MessageSyncState {
  state = {
    ...state,
    ...next,
  };

  emit();

  return { ...state };
}

/**
 * Retourne l'état courant de synchronisation.
 */
export function getSyncState(): MessageSyncState {
  return { ...state };
}

/**
 * Met le service en état de synchronisation.
 */
export function startSync(): MessageSyncState {
  return updateState({
    status: "syncing",
    error: null,
  });
}

/**
 * Signale que la synchronisation est terminée.
 */
export function completeSync(syncedAt = Date.now()): MessageSyncState {
  return updateState({
    status: "synced",
    lastSyncedAt: syncedAt,
    error: null,
  });
}

/**
 * Signale une erreur de synchronisation.
 */
export function failSync(error: unknown): MessageSyncState {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Erreur de synchronisation";

  return updateState({
    status: "error",
    error: message,
  });
}

/**
 * Passe le service en mode hors ligne.
 */
export function setOffline(): MessageSyncState {
  return updateState({
    status: "offline",
    error: null,
  });
}

/**
 * Réinitialise l'état du service.
 */
export function resetSync(): MessageSyncState {
  state = { ...DEFAULT_STATE };
  emit();

  return { ...state };
}

/**
 * Abonne un composant ou un hook aux changements.
 */
export function subscribeSync(listener: SyncListener): () => void {
  listeners.add(listener);

  listener({ ...state });

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Vérifie si une synchronisation est nécessaire.
 */
export function shouldSync(maxAgeMs = 30_000, now = Date.now()): boolean {
  if (state.status === "syncing") {
    return false;
  }

  if (state.status === "offline") {
    return false;
  }

  if (state.lastSyncedAt === null) {
    return true;
  }

  return now - state.lastSyncedAt >= maxAgeMs;
}

/**
 * Crée un événement de synchronisation.
 *
 * Cette fonction est volontairement pure :
 * elle ne déclenche aucune synchronisation backend.
 */
export function createSyncEvent(
  type: MessageSyncEvent["type"],
  options: Omit<MessageSyncEvent, "type" | "timestamp"> = {},
): MessageSyncEvent {
  return {
    type,
    timestamp: Date.now(),
    ...options,
  };
}

/**
 * Nettoie les erreurs provenant d'une opération async.
 */
export function getSyncErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Erreur de synchronisation";
}
