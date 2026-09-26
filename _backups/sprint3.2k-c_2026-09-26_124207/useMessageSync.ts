// src/features/messages/sync/hooks/useMessageSync.ts

import { useCallback, useEffect, useRef, useState } from "react";

import {
  completeSync,
  failSync,
  getSyncErrorMessage,
  getSyncState,
  resetSync,
  setOffline,
  startSync,
  subscribeSync,
  type MessageSyncState,
} from "../services/sync.service";
import { NetInfo } from "@react-native-community/netinfo";
import { AppState } from "react-native";

export interface UseMessageSyncOptions {
  /**
   * Active automatiquement la synchronisation
   * lorsque le hook est monté.
   *
   * Par défaut : true.
   */
  autoSync?: boolean;

  /**
   * Fonction qui réalise réellement la synchronisation.
   *
   * Elle est fournie par la feature afin d'éviter
   * de coupler ce hook à une API Convex particulière.
   */
  sync?: () => Promise<void>;

  /**
   * Synchronise lorsque la fenêtre revient au premier plan.
   *
   * Par défaut : true.
   */
  syncOnFocus?: boolean;

  /**
   * Synchronise lorsque la connexion revient.
   *
   * Par défaut : true.
   */
  syncOnReconnect?: boolean;
}

export interface UseMessageSyncResult extends MessageSyncState {
  isSyncing: boolean;
  isSynced: boolean;
  isOffline: boolean;
  hasError: boolean;

  syncNow: () => Promise<void>;

  markSynced: () => void;

  markOffline: () => void;

  reset: () => void;
}

export function useMessageSync(
  options: UseMessageSyncOptions = {},
): UseMessageSyncResult {
  const {
    autoSync = true,
    sync,
    syncOnFocus = true,
    syncOnReconnect = true,
  } = options;

  const [state, setState] = useState<MessageSyncState>(getSyncState());

  const syncRef = useRef(sync);
  const syncingRef = useRef(false);

  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  /**
   * Écoute l'état global du service.
   */
  useEffect(() => {
    return subscribeSync(setState);
  }, []);

  /**
   * Synchronisation manuelle.
   */
  const syncNow = useCallback(async () => {
    if (syncingRef.current) {
      return;
    }

    const currentSync = syncRef.current;

    if (!currentSync) {
      completeSync();
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline();
      return;
    }

    syncingRef.current = true;

    startSync();

    try {
      await currentSync();

      completeSync();
    } catch (error) {
      failSync(getSyncErrorMessage(error));

      throw error;
    } finally {
      syncingRef.current = false;
    }
  }, []);

  /**
   * Marque explicitement les données comme synchronisées.
   */
  const markSynced = useCallback(() => {
    completeSync();
  }, []);

  /**
   * Passe explicitement en mode hors ligne.
   */
  const markOffline = useCallback(() => {
    setOffline();
  }, []);

  /**
   * Réinitialise l'état.
   */
  const reset = useCallback(() => {
    resetSync();
  }, []);

  /**
   * Synchronisation initiale.
   */
  useEffect(() => {
    if (!autoSync) {
      return;
    }

    void syncNow();
  }, [autoSync, syncNow]);

  /**
   * Synchronisation lorsque l'application
   * revient au premier plan.
   */
  useEffect(() => {
    if (!syncOnFocus || typeof window === "undefined") {
      return;
    }

    const handleFocus = () => {
      void syncNow();
    };

    AppState.addEventListener('focus', handleFocus);

    return () => {
      AppState.removeEventListener('focus', handleFocus);
    };
  }, [syncOnFocus, syncNow]);

  /**
   * Gestion de la connexion réseau.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOnline = () => {
      if (syncOnReconnect) {
        void syncNow();
      } else {
        markSynced();
      }
    };

    const handleOffline = () => {
      markOffline();
    };

    NetInfo.addEventListener(handleOnline);

    NetInfo.addEventListener(handleOffline);

    if (!navigator.onLine) {
      markOffline();
    }

    return () => {
      NetInfo.removeEventListener(handleOnline);

      NetInfo.removeEventListener(handleOffline);
    };
  }, [markOffline, markSynced, syncOnReconnect, syncNow]);

  return {
    ...state,

    isSyncing: state.status === "syncing",

    isSynced: state.status === "synced",

    isOffline: state.status === "offline",

    hasError: state.status === "error",

    syncNow,
    markSynced,
    markOffline,
    reset,
  };
}

export default useMessageSync;
