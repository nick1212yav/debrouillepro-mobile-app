import { View, Pressable, Text } from "react-native";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Phone,
  Calendar,
  MapPin,
  Eye,
} from "lucide-react-native";

interface Props {
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onContact: () => void;
  onVisit: () => void;
  onView: () => void;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  color: string;
}

export function PropertyActions({
  onLike,
  onComment,
  onShare,
  onBookmark,
  onContact,
  onVisit,
  onView,
  likeCount,
  commentCount,
  isLiked,
  isBookmarked,
  color,
}: Props) {
  return (
    <View className="space-y-3"><View className="flex flex-wrap gap-2"><Pressable onPress={onView} className="flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform text-white" style={{  }}><Eye size={14} /><Text>Voir le bien</Text></Pressable><Pressable onPress={onContact} className="flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform" style={{ backgroundColor: `${color}20`, color, borderStyle: "solid" }}><Phone size={14} /><Text>Contacter</Text></Pressable><Pressable onPress={onVisit} className="flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform" style={{ backgroundColor: `${color}20`, color, borderStyle: "solid" }}><Calendar size={14} /><Text>Visiter</Text></Pressable></View><View className="flex items-center gap-2 pt-3 border-t border-white/5"><Pressable onPress={onLike} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 transition-colors"><Heart size={14} className={isLiked ? "fill-purple-400 text-purple-400" : ""} /><Text>{likeCount > 0 ? likeCount : ""}</Text></Pressable><Pressable onPress={onComment} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 transition-colors"><MessageCircle size={14} /><Text>{commentCount > 0 ? commentCount : ""}</Text></Pressable><Pressable onPress={onShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 transition-colors"><Share2 size={14} /></Pressable><Pressable onPress={onBookmark} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 transition-colors ml-auto"><Bookmark size={14} className={isBookmarked ? "fill-yellow-400 text-yellow-400" : ""} /></Pressable></View></View>
  );
}
