import { Image, Pressable, Text, View } from "react-native";
import { Trash2, Users } from "lucide-react-native";
import { PublicationBadge } from "./PublicationBadge";
import type { Publication, PublicationType } from "../types";

interface Props {
  publication: Publication;
  type: PublicationType;
  emoji?: string;
  onDelete?: () => void;
  isMine: boolean;
  formatTime: (timestamp: number) => string;
}

export function PublicationHeader({
  publication,
  type,
  emoji = "💬",
  onDelete,
  isMine,
  formatTime,
}: Props) {
  const authorName = publication.author?.name ?? "Utilisateur";
  const authorAvatar = publication.author?.avatar;

  const initials = authorName.trim().charAt(0).toUpperCase() || "U";

  return (
    <View className="flex-row items-center gap-2 p-3 pb-2">
      <View className="relative">
        {authorAvatar ? (
          <Image
            className="h-9 w-9 rounded-xl"
            source={{ uri: authorAvatar }}
            accessibilityLabel={`Avatar de ${authorName}`}
          />
        ) : (
          <View
            className="h-9 w-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgba(139,92,246,0.2)",
            }}
          >
            <Text className="text-sm font-bold text-white/60">{initials}</Text>
          </View>
        )}

        <View
          className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full"
          style={{
            backgroundColor: "#0a0a1a",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <Text className="text-xs">{emoji}</Text>
        </View>
      </View>

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-xs font-bold text-white">
          {authorName}
        </Text>

        <View className="flex-row items-center gap-1">
          <Users
            size={9}
            color="#A78BFA"
            accessibilityLabel="Type de publication"
          />

          <Text numberOfLines={1} className="text-[10px] text-purple-400">
            {type}
          </Text>

          <Text className="flex-shrink-0 text-[10px] text-white/20">
            · {formatTime(publication._creationTime)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2">
        <PublicationBadge type={type} />

        {isMine && onDelete ? (
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel="Supprimer la publication"
            hitSlop={8}
            className="items-center justify-center rounded-lg p-1"
          >
            <Trash2 size={13} color="rgba(255,255,255,0.25)" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
