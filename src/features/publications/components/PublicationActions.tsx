import { Text, Pressable, View } from "react-native";
import type { PublicationAction, Publication } from "../types";

interface Props {
  publication: Publication;
  actions: PublicationAction[];
  onAction: (actionId: string) => void;
}

export function PublicationActions({ publication, actions, onAction }: Props) {
  const countMap: Record<string, number> = {
    likeCount: publication.likeCount ?? 0,
    commentCount: publication.commentCount ?? 0,
    viewCount: publication.viewCount ?? 0,
    shareCount: publication.shareCount ?? 0,
    bookmarkCount: publication.bookmarkCount ?? 0,
  };

  return (
    <View className="flex items-center gap-1">
      {actions.map((action) => {
        const Icon = action.icon;
        const isLiked = action.id === "like" && publication.likedByMe;
        const count =
          action.showCount && action.countKey
            ? countMap[action.countKey]
            : null;
        const isPrimary = action.primary;

        return (
          <Pressable key={action.id} onPress={() => onAction(action.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer transition-all active:scale-90 ${
              isPrimary ? "" : "hover:bg-white/5"
            }`} style={
              isPrimary
                ? { backgroundColor: isLiked
                                      ? "rgba(139,92,246,0.2)"
                                      : "rgba(255,255,255,0.04)", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }
                : {}
            }>
            <Icon
              size={14}
              className={
                isLiked ? "text-purple-400 fill-purple-400" : "text-white/40"
              }
            />
            {count !== null && count > 0 && (
              <Text className="text-[11px] font-medium" style={{
                  color: isLiked ? "#A78BFA" : "rgba(255,255,255,0.4)",
                }}>
                {count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
