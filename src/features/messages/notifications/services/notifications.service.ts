import { Linking } from "react-native";

// src/features/messages/notifications/services/notifications.service.ts

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

const listeners = new Set<NotificationListener>();

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

/**
 * Retourne les préférences actuelles.
 */
export function getNotificationPreferences(): NotificationPreferences {
  return { ...preferences };
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

  return { ...preferences };
}

/**
 * Réinitialise les préférences.
 */
export function resetNotificationPreferences(): NotificationPreferences {
  preferences = {
    ...DEFAULT_PREFERENCES,
  };

  return { ...preferences };
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
  return notifications.reduce(
    (count, notification) => count + (notification.read ? 0 : 1),
    0,
  );
}

/**
 * Ajoute une notification.
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
 * Abonne un composant aux notifications.
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
 * des notifications navigateur.
 */
export async function requestBrowserPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

/**
 * Vérifie si les notifications navigateur
 * sont disponibles.
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && typeof Notification !== "undefined";
}

/**
 * Affiche une notification navigateur.
 */
export function showBrowserNotification(
  notification: MessageNotification,
): Notification | null {
  if (
    !preferences.enabled ||
    !preferences.browser ||
    !isBrowserNotificationSupported()
  ) {
    return null;
  }

  if (Notification.permission !== "granted") {
    return null;
  }

  const browserNotification = new Notification(notification.title, {
    body: notification.body,
    icon: notification.senderAvatar ?? undefined,
    tag: notification.id,
    data: {
      notificationId: notification.id,
      conversationId: notification.conversationId,
      messageId: notification.messageId,
      url: notification.url,
    },
  });

  if (notification.url) {
    browserNotification.onclick = () => {
      if (typeof window !== "undefined") {
        window.focus();
        Linking.openURL(notification.url!);
      }
    };
  }

  return browserNotification;
}

/**
 * Joue le son de notification.
 *
 * Aucun fichier audio externe n'est requis.
 */
export function playNotificationSound(): void {
  if (
    !preferences.enabled ||
    !preferences.sound ||
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    const AudioContextClass =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();

    const oscillator = context.createOscillator();

    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);

    gain.gain.setValueAtTime(0.0001, context.currentTime);

    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.01);

    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.13);

    oscillator.addEventListener(
      "ended",
      () => {
        void context.close();
      },
      { once: true },
    );
  } catch {
    // Le son est optionnel : aucune erreur ne doit
    // perturber le système de notifications.
  }
}

/**
 * Crée un identifiant local unique.
 */
function createNotificationId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `notification-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
