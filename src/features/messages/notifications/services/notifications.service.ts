// src/features/messages/notifications/services/notifications.service.ts

import { AppState, type AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";

export type MessageNotificationType =
  | "message"
  | "mention"
  | "reply"
  | "reaction"
  | "call"
  | "system";

export interface MessageNotification {
  id: string;
  type: MessageNotificationType;
  title: string;
  body?: string;
  conversationId?: string;
  messageId?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  timestamp: number;
  read: boolean;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  browser: boolean;
  mentions: boolean;
  replies: boolean;
  reactions: boolean;
  calls: boolean;
  system: boolean;
}

export type NativeNotificationPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined"
  | "unsupported";

type NotificationListener = (notifications: MessageNotification[]) => void;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  browser: true,
  mentions: true,
  replies: true,
  reactions: true,
  calls: true,
  system: true,
};

let notifications: MessageNotification[] = [];

let preferences: NotificationPreferences = {
  ...DEFAULT_PREFERENCES,
};

let currentAppState: AppStateStatus = AppState.currentState;

const listeners = new Set<NotificationListener>();

/**
 * Configure le comportement des notifications lorsque
 * l'application est ouverte.
 *
 * Cette configuration est volontairement centralisée ici
 * afin que le module Messages possède un comportement stable.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

AppState.addEventListener("change", (nextState) => {
  currentAppState = nextState;
});

function emit(): void {
  const snapshot = [...notifications];

  for (const listener of listeners) {
    listener(snapshot);
  }
}

function isNotificationEnabled(notification: MessageNotification): boolean {
  if (!preferences.enabled) {
    return false;
  }

  switch (notification.type) {
    case "mention":
      return preferences.mentions;

    case "reply":
      return preferences.replies;

    case "reaction":
      return preferences.reactions;

    case "call":
      return preferences.calls;

    case "system":
      return preferences.system;

    case "message":
    default:
      return true;
  }
}

function mapPermissionStatus(
  status: Notifications.PermissionStatus,
): NativeNotificationPermissionStatus {
  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
      return "granted";

    case Notifications.PermissionStatus.DENIED:
      return "denied";

    case Notifications.PermissionStatus.UNDETERMINED:
    default:
      return "undetermined";
  }
}

/**
 * Vérifie si l'application est actuellement au premier plan.
 */
export function isApplicationActive(): boolean {
  return currentAppState === "active";
}

/**
 * Retourne les préférences actuelles.
 */
export function getNotificationPreferences(): NotificationPreferences {
  return {
    ...preferences,
  };
}

/**
 * Met à jour les préférences.
 */
export function setNotificationPreferences(
  next: Partial<NotificationPreferences>,
): NotificationPreferences {
  preferences = {
    ...preferences,
    ...next,
  };

  return {
    ...preferences,
  };
}

/**
 * Réinitialise les préférences.
 */
export function resetNotificationPreferences(): NotificationPreferences {
  preferences = {
    ...DEFAULT_PREFERENCES,
  };

  return {
    ...preferences,
  };
}

/**
 * Retourne toutes les notifications.
 */
export function getNotifications(): MessageNotification[] {
  return [...notifications];
}

/**
 * Retourne uniquement les notifications non lues.
 */
export function getUnreadNotifications(): MessageNotification[] {
  return notifications.filter((notification) => !notification.read);
}

/**
 * Retourne le nombre de notifications non lues.
 */
export function getUnreadNotificationCount(): number {
  return notifications.reduce((count, notification) => {
    return notification.read ? count : count + 1;
  }, 0);
}

/**
 * Ajoute une notification locale au store du module.
 */
export function addNotification(
  notification: Omit<MessageNotification, "id" | "timestamp" | "read"> & {
    id?: string;
    timestamp?: number;
    read?: boolean;
  },
): MessageNotification | null {
  const nextNotification: MessageNotification = {
    ...notification,
    id: notification.id ?? createNotificationId(),
    timestamp: notification.timestamp ?? Date.now(),
    read: notification.read ?? false,
  };

  if (!isNotificationEnabled(nextNotification)) {
    return null;
  }

  notifications = [nextNotification, ...notifications];

  emit();

  return nextNotification;
}

/**
 * Marque une notification comme lue.
 */
export function markNotificationAsRead(notificationId: string): void {
  let changed = false;

  notifications = notifications.map((notification) => {
    if (notification.id !== notificationId || notification.read) {
      return notification;
    }

    changed = true;

    return {
      ...notification,
      read: true,
    };
  });

  if (changed) {
    emit();
  }
}

/**
 * Marque toutes les notifications comme lues.
 */
export function markAllNotificationsAsRead(): void {
  const hasUnread = notifications.some((notification) => !notification.read);

  if (!hasUnread) {
    return;
  }

  notifications = notifications.map((notification) => ({
    ...notification,
    read: true,
  }));

  emit();
}

/**
 * Supprime une notification.
 */
export function removeNotification(notificationId: string): void {
  const previousLength = notifications.length;

  notifications = notifications.filter(
    (notification) => notification.id !== notificationId,
  );

  if (notifications.length !== previousLength) {
    emit();
  }
}

/**
 * Supprime toutes les notifications.
 */
export function clearNotifications(): void {
  if (notifications.length === 0) {
    return;
  }

  notifications = [];

  emit();
}

/**
 * Abonne un composant aux changements
 * du système de notifications.
 */
export function subscribeNotifications(
  listener: NotificationListener,
): () => void {
  listeners.add(listener);

  listener([...notifications]);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Demande l'autorisation d'afficher
 * des notifications natives.
 */
export async function requestBrowserPermission(): Promise<NativeNotificationPermissionStatus> {
  try {
    const currentPermissions = await Notifications.getPermissionsAsync();

    if (currentPermissions.status === Notifications.PermissionStatus.GRANTED) {
      return "granted";
    }

    const requestedPermissions = await Notifications.requestPermissionsAsync();

    return mapPermissionStatus(requestedPermissions.status);
  } catch (error) {
    console.warn(
      "[notifications.service] Impossible de demander la permission:",
      error,
    );

    return "unsupported";
  }
}

/**
 * Alias explicite pour le runtime mobile.
 *
 * On conserve requestBrowserPermission pour éviter de casser
 * les imports existants pendant la migration.
 */
export async function requestNotificationPermission(): Promise<NativeNotificationPermissionStatus> {
  return requestBrowserPermission();
}

/**
 * Vérifie si les notifications natives sont disponibles.
 */
export async function isBrowserNotificationSupported(): Promise<boolean> {
  try {
    const permissions = await Notifications.getPermissionsAsync();

    return permissions !== null;
  } catch {
    return false;
  }
}

/**
 * Alias mobile plus explicite.
 */
export async function isNotificationSupported(): Promise<boolean> {
  return isBrowserNotificationSupported();
}

/**
 * Programme immédiatement une notification locale native.
 *
 * Le store interne est conservé séparément :
 * addNotification() gère l'historique applicatif,
 * showBrowserNotification() gère l'affichage système.
 */
export async function showBrowserNotification(
  notification: MessageNotification,
): Promise<string | null> {
  if (
    !preferences.enabled ||
    !preferences.browser ||
    !isNotificationEnabled(notification)
  ) {
    return null;
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();

    if (permissions.status !== Notifications.PermissionStatus.GRANTED) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        sound: preferences.sound ? "default" : undefined,
        data: {
          notificationId: notification.id,
          conversationId: notification.conversationId,
          messageId: notification.messageId,
          senderId: notification.senderId,
          url: notification.url,
          metadata: notification.metadata,
        },
      },
      trigger: null,
    });

    return notificationId;
  } catch (error) {
    console.warn(
      "[notifications.service] Impossible d'afficher la notification:",
      error,
    );

    return null;
  }
}

/**
 * Alias mobile plus explicite.
 */
export async function showNativeNotification(
  notification: MessageNotification,
): Promise<string | null> {
  return showBrowserNotification(notification);
}

/**
 * Ajoute une notification au store et,
 * si nécessaire, l'affiche au niveau système.
 */
export async function dispatchNotification(
  notification: Omit<MessageNotification, "id" | "timestamp" | "read"> & {
    id?: string;
    timestamp?: number;
    read?: boolean;
  },
): Promise<MessageNotification | null> {
  const created = addNotification(notification);

  if (!created) {
    return null;
  }

  /**
   * Si l'application est ouverte, l'interface
   * peut déjà afficher la notification via le store.
   *
   * La notification système reste néanmoins configurable.
   */
  if (!isApplicationActive()) {
    await showNativeNotification(created);
  }

  return created;
}

/**
 * Joue le son de notification.
 *
 * Le son est principalement géré par expo-notifications
 * pour les notifications système. Cette fonction est
 * conservée pour les appels explicites provenant de
 * l'interface applicative.
 */
export async function playNotificationSound(): Promise<void> {
  if (!preferences.enabled || !preferences.sound) {
    return;
  }

  try {
    /**
     * Aucun fichier audio n'est chargé ici.
     *
     * Sur mobile, expo-notifications joue le son système
     * lorsqu'une notification est affichée avec
     * sound: "default".
     *
     * Cette fonction reste volontairement sans effet
     * sonore direct afin d'éviter une dépendance à un asset
     * inexistant et de ne jamais provoquer d'erreur.
     */
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
    });
  } catch {
    // Le son reste optionnel.
  }
}

/**
 * Supprime les notifications système affichées
 * par l'application.
 */
export async function dismissAllNativeNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    // Une erreur native ne doit pas perturber
    // le système applicatif.
  }
}

/**
 * Annule une notification système programmée.
 */
export async function cancelNativeNotification(
  nativeNotificationId: string,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(nativeNotificationId);
  } catch {
    // Ignorer les erreurs d'annulation.
  }
}

/**
 * Crée un identifiant local unique.
 */
function createNotificationId(): string {
  return `notification-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
