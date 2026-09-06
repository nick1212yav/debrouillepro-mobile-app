import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { Send, User, Heart } from "lucide-react-native";

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
  maxHeight?: number | string;
}

export function CommunityLiveChat({
  messages,
  onSend,
  onLike,
  isLive = true,
  maxHeight = 300,
}: Props) {
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Défilement automatique vers le bas lors de la réception d'un nouveau message
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
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
    <View className="space-y-2">
      <View className="flex flex-row items-center justify-between">
        <Text className="text-sm font-medium text-white/50">
          Chat en direct
        </Text>
        {isLive && (
          <View className="flex flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <Text className="text-[10px] text-red-400 font-bold">LIVE</Text>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="space-y-1 pr-1"
        style={{ maxHeight }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <Text className="text-white/30 text-sm text-center py-4">
            Aucun message. Soyez le premier à parler !
          </Text>
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              className={`flex flex-row items-start gap-2 p-2 rounded-xl mb-1 ${
                msg.isMine
                  ? "bg-purple-500/10 border border-purple-500/20"
                  : "bg-white/5 border border-white/5"
              }`}
              style={{ borderStyle: "solid" }}
            >
              {/* Avatar */}
              {msg.userAvatar ? (
                <Image
                  source={{ uri: msg.userAvatar }}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <View className="w-7 h-7 rounded-full flex items-center justify-center bg-purple-500/20 flex-shrink-0">
                  <User size={12} className="text-purple-400" />
                </View>
              )}

              <View className="flex-1 min-w-0">
                <View className="flex flex-row items-center gap-2">
                  <Text className="text-white/80 text-xs font-medium">
                    {msg.userName}
                  </Text>
                  <Text className="text-white/20 text-[10px]">
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
                <Text className="text-white/70 text-sm mt-0.5">
                  {msg.message}
                </Text>
              </View>

              <Pressable
                onPress={() => onLike(msg.id)}
                className="flex flex-row items-center gap-0.5 flex-shrink-0"
              >
                <Heart
                  size={12}
                  className={msg.likes > 0 ? "fill-red-400 text-red-400" : ""}
                  color={msg.likes > 0 ? "#EF4444" : "rgba(255,255,255,0.3)"}
                />
                {msg.likes > 0 && (
                  <Text className="text-[10px] text-white/30 ml-0.5">
                    {msg.likes}
                  </Text>
                )}
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Input */}
      <View className="flex flex-row items-center gap-2">
        <TextInput
          value={newMessage}
          onChangeText={(text) => setNewMessage(text)}
          placeholder="Écrire un message..."
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
          onSubmitEditing={handleSend}
        />

        <Pressable
          onPress={handleSend}
          disabled={!newMessage.trim()}
          className="px-4 py-2 rounded-xl items-center justify-center disabled:opacity-40"
          style={{
            backgroundColor: "#8B5CF6", // Violet
          }}
        >
          <Send size={16} className="text-white" />
        </Pressable>
      </View>
    </View>
  );
}
