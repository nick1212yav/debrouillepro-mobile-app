import { Pressable, Text, View, Linking, GestureResponderEvent } from "react-native";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Phone,
  Calendar,
  Smartphone,
} from "lucide-react-native";

interface Props {
  phone?: string;
  onContact: (e: GestureResponderEvent) => void;
  onVisit: (e: GestureResponderEvent) => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  color: string;
}

export function PropertyFooter({
  phone,
  onContact,
  onVisit,
  onLike,
  onComment,
  onShare,
  onBookmark,
  likeCount,
  commentCount,
  isLiked,
  isBookmarked,
  color,
}: Props) {
  // ✅ Fonctions pour Appeler et WhatsApp
  const handleCall = (e: GestureResponderEvent) => {
    if (phone) {
      undefined.href = `tel:${phone}`;
    }
  };

  const handleWhatsApp = (e: GestureResponderEvent) => {
    if (phone) {
      const cleaned = phone.replace(/[^0-9]/g, "");
      Linking.openURL(String(`https://wa.me/${cleaned}`));
    }
  };

  return (
    <>
      {/* ✅ Actions principales : Appel, WhatsApp, Contact, Visite */}
      <View className="flex flex-wrap gap-2 mt-3">
        {phone && (
          <>
            <Pressable
              onPress={handleCall}
              className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "rgba(16,185,129,0.2)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}
            >
              <Phone size={13} /> Appeler
            </Pressable>
            <Pressable
              onPress={handleWhatsApp}
              className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "rgba(37,211,102,0.2)", borderWidth: 1, borderColor: "rgba(37,211,102,0.2)", borderStyle: "solid" }}
            >
              <Smartphone size={13} /> WhatsApp
            </Pressable>
          </>
        )}
        <Pressable
          onPress={onContact}
          className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
          style={{ backgroundColor: `${color}20`, borderStyle: "solid" }}
        >
          <MessageCircle size={13} /> Contacter
        </Pressable>
        <Pressable
          onPress={onVisit}
          className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 text-white"
          style={{  }}
        >
          <Calendar size={13} /> Visiter
        </Pressable>
      </View>

      {/* ✅ Actions sociales */}
      <View className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <Pressable
          onPress={onLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50"
        >
          <Heart
            size={14}
            className={isLiked ? "fill-purple-400 text-purple-400" : ""}
          />
          <Text>{likeCount > 0 ? likeCount : ""}</Text>
        </Pressable>

        <Pressable
          onPress={onComment}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50"
        >
          <MessageCircle size={14} />
          <Text>{commentCount > 0 ? commentCount : ""}</Text>
        </Pressable>

        <Pressable
          onPress={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50"
        >
          <Share2 size={14} />
        </Pressable>

        <Pressable
          onPress={onBookmark}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 ml-auto"
        >
          <Bookmark
            size={14}
            className={isBookmarked ? "fill-yellow-400 text-yellow-400" : ""}
          />
        </Pressable>
      </View>
    </>
  );
}
