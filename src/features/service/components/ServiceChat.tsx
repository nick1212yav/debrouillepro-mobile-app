import { Pressable } from "react-native";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react-native";

export function ServiceChat({ userId }: { userId?: string }) {
  const navigate = useNavigate();
  return (
    <Pressable onPress={() => userId && navigate(`/messages/new?userId=${userId}`)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400">
      <MessageCircle size={16} /> Message
    </Pressable>
  );
}
