import { Pressable, View, Text, Image } from "react-native";
import { Users, Trash2 } from "lucide-react-native";
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
  // Sécurisation des informations auteur
  const authorName =
    publication.author?.name ??
    (publication as any).authorName ??
    "Utilisateur";

  const authorAvatar =
    publication.author?.avatar ??
    (publication as any).authorAvatar ??
    undefined;

  return (
    <View className="p-3 pb-2 flex items-center gap-2">
      <View className="relative">
        {authorAvatar ? (
          <Image
           
           
            className="w-9 h-9 rounded-xl object-cover"
           source={{ uri: authorAvatar }} accessibilityLabel={authorName}/>
        ) : (
          <View
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white/60"
            style={{ backgroundColor: "rgba(139,92,246,0.2)" }}
          >
            {authorName.charAt(0).toUpperCase()}
          </View>
        )}

        <View
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
          style={{ backgroundColor: "#0a0a1a", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          {emoji}
        </View>
      </View>

      <View className="flex-1 min-w-0">
        <Text className="text-xs font-bold text-white truncate">{authorName}</Text>

        <View className="flex items-center gap-1">
          <Users size={9} className="text-purple-400 flex-shrink-0" />

          <Text className="text-[10px] text-purple-400 truncate">{type}</Text>

          <Text className="text-white/20 text-[10px] flex-shrink-0">
            · {formatTime(publication._creationTime)}
          </Text>
        </View>
      </View>

      <View className="flex items-center gap-2">
        <PublicationBadge type={type} />

        {isMine && (
          <Pressable
            onPress={onDelete}
            className=""
          >
            <Trash2 size={13} className="text-white/25" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
