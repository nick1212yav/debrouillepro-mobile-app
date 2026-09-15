import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState, useRef, useEffect } from "react";
import { Send, User, Heart, X } from "lucide-react-native";

/* __DEBROUILLEPRO_NATIVE_DOM_API_HELPERS_V8__ — scrollIntoView helper */
const __debrouilleProNativeScrollIntoView = async (ref: { current?: { measure?: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void } }): Promise<void> => {
  return new Promise((resolve) => {
    ref.current?.measure?.((_x, _y, _w, _h, _px, py) => {
      console.warn('__debrouilleProNativeScrollIntoView: implement scrollTo with pageY on your ScrollView ref');
      resolve();
    });
  });
};


interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: number;
  isMine: boolean;
  likes: number;
}

interface Props {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onLike: (messageId: string) => void;
  isLive?: boolean;
  maxHeight?: string;
}

export function CommunityLiveChat({
  messages,
  onSend,
  onLike,
  isLive = true,
  maxHeight = "300px",
}: Props) {
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<View>(null);
  const scrollContainerRef = useRef<View>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      __debrouilleProNativeScrollIntoView(chatEndRef.current);
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSend(newMessage.trim());
    setNewMessage("");
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View className="space-y-2"><View className="flex items-center justify-between"><Text className="text-sm font-medium text-white/50">Chat en direct</Text>{isLive && (
          <Text className="flex items-center gap-1.5 text-[10px] text-red-400"><Text className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />LIVE
          </Text>
        )}</View><View ref={scrollContainerRef} className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight }}>{messages.length === 0 ? (
          <Text className="text-white/30 text-sm text-center py-4">Aucun message. Soyez le premier à parler !
          </Text>
        ) : (
          messages.map((msg) => (
            <View key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-2 p-2 rounded-xl transition-colors ${
                msg.isMine
                  ? "bg-purple-500/10 border border-purple-500/20"
                  : "bg-white/5 border border-white/5"
              }`}>
              {/* Avatar */}
              {msg.userAvatar ? (
                <Image className="w-7 h-7 rounded-full object-cover flex-shrink-0" source={{ uri: msg.userAvatar }} accessibilityLabel={msg.userName} />
              ) : (
                <View className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-500/20 flex-shrink-0"><User size={12} className="text-purple-400" /></View>
              )}
              <View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white/80 text-xs font-medium">{msg.userName}</Text><Text className="text-white/20 text-[10px]">{formatTime(msg.timestamp)}</Text></View><Text className="text-white/70 text-sm">{msg.message}</Text></View>
              <Pressable onPress={() => onLike(msg.id)} className="flex items-center gap-0.5 text-[10px] text-white/30 transition-colors flex-shrink-0"><Heart size={12} className={msg.likes > 0 ? "fill-red-400 text-red-400" : ""} />{msg.likes > 0 && <Text>{msg.likes}</Text>}</Pressable>
            </View>
          ))
        )}<View ref={chatEndRef} /></View>{}<View className="flex items-center gap-2"><TextInput value={newMessage} onChangeText={(value) => setNewMessage(value)} placeholder="Écrire un message..." className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-purple-400 transition-colors placeholder:text-white/30" onKeyPress={(e) => e.nativeEvent.key === "Enter" && handleSend()} /><Pressable onPress={handleSend} disabled={!newMessage.trim()} className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-40 active:scale-95 transition-transform" style={{  }}><Send size={16} /></Pressable></View></View>
  );
}
