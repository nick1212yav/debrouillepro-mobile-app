import { View, Pressable, Text } from "react-native";
import { useState } from "react";
import {
  Bell,
  X,
  Heart,
  MessageCircle,
  UserPlus,
  Flag,
  Zap,
  Clock,
} from "lucide-react-native";

interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "mention" | "report" | "boost";
  message: string;
  createdAt: number;
  read: boolean;
  link?: string;
}

interface Props {
  notifications: Notification[];
  onRead: (id: string) => Promise<void>;
  onReadAll: () => Promise<void>;
  onAction: (notification: Notification) => void;
}

const NOTIFICATION_ICONS = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: UserPlus,
  report: Flag,
  boost: Zap,
};

export function CommunityNotifications({
  notifications,
  onRead,
  onReadAll,
  onAction,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)} j`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <View className="relative">
      <Pressable
        onPress={handleOpen}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
      >
        <Bell size={18} className="text-white/60" />
        {unreadCount > 0 && (
          <Text className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-medium">
            {unreadCount}
          </Text>
        )}
      </Pressable>
      <View>
        {isOpen && (
          <View className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl p-3 bg-[#0D1117] border border-white/10 z-50">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-white font-semibold text-sm">
                Notifications
              </Text>
              <View className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Pressable
                    onPress={onReadAll}
                    className="text-[10px] text-white/30 transition-colors"
                  >
                    <Text className="text-white/30 text-[10px]">
                      Tout marquer comme lu
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleClose}
                  className="text-white/30 transition-colors"
                >
                  <X size={14} className="text-white/30" />
                </Pressable>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View className="text-center py-6 text-white/30 text-sm">
                <Text className="text-white/30 text-sm text-center">
                  Aucune notification
                </Text>
              </View>
            ) : (
              <View className="space-y-1.5">
                {notifications.map((notif) => {
                  const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
                  return (
                    <Pressable
                      key={notif.id}
                      onPress={() => onAction(notif)}
                      className={`w-full flex items-start gap-2 p-2 rounded-xl text-left transition-colors ${
                        notif.read ? "opacity-60" : "bg-white/5"
                      } hover:bg-white/10`}
                    >
                      <View className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500/20">
                        <Icon size={14} className="text-purple-400" />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text className="text-white/80 text-sm">
                          {notif.message}
                        </Text>
                        <View className="flex items-center gap-2 text-white/20 text-[10px] mt-0.5">
                          <Clock size={10} className="text-white/20" />
                          <Text className="text-white/20 text-[10px]">
                            {formatDate(notif.createdAt)}
                          </Text>
                        </View>
                      </View>
                      {!notif.read && (
                        <Pressable
                          onPress={(e) => {
                            onRead(notif.id);
                          }}
                          className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0"
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
