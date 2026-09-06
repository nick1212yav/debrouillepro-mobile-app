import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityNotifications.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type NotificationType =
  | "comment"
  | "message"
  | "job"
  | "immo"
  | "payment"
  | "system"
  | "delivery"
  | "sante"
  | "agri"
  | "transport"
  | "community"
  | "like"
  | "follow"
  | "boost"
  | "event"
  | "streak"
  | "digest"
  | "annonce";

export function useCommunityNotifications() {
  const notificationsQuery = useQuery(api.community.listNotifications, {});
  const markAsRead = useMutation(api.community.markNotificationRead);
  const markAllAsRead = useMutation(api.community.markAllNotificationsRead);
  const sendNotification = useMutation(api.community.sendNotification);

  const notifications = notificationsQuery || [];

  return {
    notifications,
    isLoading: notificationsQuery === undefined,
    unreadCount: notifications.filter((n: any) => !n.read).length,
    markAsRead: async (notificationId: Id<"notifications">) => {
      try {
        await markAsRead({ notificationId });
      } catch (error) {
        console.error("Erreur lors du marquage comme lu", error);
      }
    },
    markAllAsRead: async () => {
      try {
        await markAllAsRead({});
        UIService.openToast("Toutes les notifications marquées comme lues", "success");
      } catch (error) {
        UIService.openToast("Erreur lors du marquage", "error");
      }
    },
    sendNotification: async (data: {
      recipientId: Id<"users">;
      type: NotificationType;
      title: string;
      body: string;
      link?: string;
      data?: any;
    }) => {
      try {
        await sendNotification(data);
      } catch (error) {
        console.error("Erreur lors de l'envoi de la notification", error);
      }
    },
  };
}
