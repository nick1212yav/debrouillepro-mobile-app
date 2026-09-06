// src/features/messages/notifications/hooks/useMessageNotifications.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addNotification,
  clearNotifications,
  getNotificationPreferences,
  getUnreadNotificationCount,
  getUnreadNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  playNotificationSound,
  removeNotification,
  requestBrowserPermission,
  setNotificationPreferences,
  showBrowserNotification,
  subscribeNotifications,
  type MessageNotification,
  type NotificationPreferences,
} from "../services/notifications.service";

export interface UseMessageNotificationsOptions {
  autoRequestPermission?: boolean;
  showBrowserNotifications?: boolean;
  playSound?: boolean;
}

export interface UseMessageNotificationsResult {
  notifications: MessageNotification[];
  unreadNotifications: MessageNotification[];
  unreadCount: number;

  preferences: NotificationPreferences;

  add: (
    notification: Omit<MessageNotification, "id" | "timestamp" | "read"> & {
      id?: string;
      timestamp?: number;
      read?: boolean;
    },
  ) => MessageNotification | null;

  markAsRead: (notificationId: string) => void;

  markAllAsRead: () => void;

  remove: (notificationId: string) => void;

  clear: () => void;

  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;

  requestPermission: () => Promise<NotificationPermission | "unsupported">;
}

export function useMessageNotifications(
  options: UseMessageNotificationsOptions = {},
): UseMessageNotificationsResult {
  const {
    autoRequestPermission = false,
    showBrowserNotifications = true,
    playSound = true,
  } = options;

  const [notifications, setNotifications] = useState<MessageNotification[]>([]);

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    getNotificationPreferences(),
  );

  useEffect(() => {
    return subscribeNotifications(setNotifications);
  }, []);

  useEffect(() => {
    if (!autoRequestPermission) {
      return;
    }

    void requestBrowserPermission();
  }, [autoRequestPermission]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  );

  const unreadCount = unreadNotifications.length;

  const add = useCallback(
    (
      notification: Omit<MessageNotification, "id" | "timestamp" | "read"> & {
        id?: string;
        timestamp?: number;
        read?: boolean;
      },
    ) => {
      const created = addNotification(notification);

      if (!created) {
        return null;
      }

      if (showBrowserNotifications) {
        showBrowserNotification(created);
      }

      if (playSound) {
        playNotificationSound();
      }

      return created;
    },
    [playSound, showBrowserNotifications],
  );

  const markAsRead = useCallback((notificationId: string) => {
    markNotificationAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    markAllNotificationsAsRead();
  }, []);

  const remove = useCallback((notificationId: string) => {
    removeNotification(notificationId);
  }, []);

  const clear = useCallback(() => {
    clearNotifications();
  }, []);

  const updatePreferences = useCallback(
    (next: Partial<NotificationPreferences>) => {
      const updated = setNotificationPreferences(next);

      setPreferences(updated);
    },
    [],
  );

  const requestPermission = useCallback(async () => {
    return requestBrowserPermission();
  }, []);

  return {
    notifications,
    unreadNotifications,
    unreadCount,

    preferences,

    add,
    markAsRead,
    markAllAsRead,
    remove,
    clear,
    updatePreferences,
    requestPermission,
  };
}

export default useMessageNotifications;
