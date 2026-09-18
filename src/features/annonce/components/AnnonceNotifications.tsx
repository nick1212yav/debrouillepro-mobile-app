import { View, Pressable, Text } from "react-native";
import { useState } from "react";
import {
  Bell,
  X,
  Package,
  Heart,
  MessageCircle,
  TrendingUp,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const ICONS = {
  offer: Package,
  message: MessageCircle,
  favorite: Heart,
  view: TrendingUp,
  sale: Package,
};

export function AnnonceNotifications() {
  const [open, setOpen] = useState(false);
  const notifications = useQuery(api.annonceNotifications.getForAnnonces, {});

  const unread = notifications?.filter((n) => !n.read).length || 0;

  const getIcon = (type: string) => {
    if (
      type === "offer" ||
      type === "message" ||
      type === "favorite" ||
      type === "view" ||
      type === "sale"
    ) {
      return ICONS[type as keyof typeof ICONS] || Bell;
    }
    return Bell;
  };

  return (
    <View className="relative">
      <Pressable
        onPress={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors"
      >
        <Bell size={18} className="text-white/60" />
        {unread > 0 && (
          <Text className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center bg-red-500 text-white">
            {unread}
          </Text>
        )}
      </Pressable>
      <View>
        {open && (
          <View
            className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl p-3 z-50"
            style={{
              backgroundColor: "#0D1117",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              borderStyle: "solid",
            }}
          >
            <View className="flex items-center justify-between mb-3">
              <Text className="text-white font-semibold text-sm">
                Notifications
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                className="text-white/30"
              >
                <X size={14} className="text-white/30" />
              </Pressable>
            </View>

            {notifications?.length === 0 ? (
              <View className="text-white/30 text-sm text-center py-4">
                <Text className="text-white/30 text-sm text-center">
                  Aucune notification
                </Text>
              </View>
            ) : (
              <View className="space-y-2">
                {notifications?.map((n) => {
                  const Icon = getIcon(n.type);
                  return (
                    <View
                      key={n._id}
                      className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                        n.read ? "opacity-50" : "bg-white/5"
                      }`}
                    >
                      <Icon
                        size={14}
                        className="text-orange-400 flex-shrink-0 mt-0.5"
                      />
                      <View className="flex-1 min-w-0">
                        <Text className="text-white text-xs font-medium">
                          {n.title}
                        </Text>
                        <Text className="text-white/40 text-xs truncate">
                          {n.body}
                        </Text>
                        <Text className="text-white/20 text-[10px]">
                          {new Date(n._creationTime).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
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
