import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
// src/features/marketplace/components/ProductLiveChat.tsx
import { useState } from "react";
import { Send, Users, X } from "lucide-react-native";

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: number;
}

interface Props {
  isLive: boolean;
  viewerCount: number;
  messages: Message[];
  onSend: (text: string) => void;
  onClose: () => void;
}

export function ProductLiveChat({
  isLive,
  viewerCount,
  messages,
  onSend,
  onClose,
}: Props) {
  const [input, setInput] = useState("");

  if (!isLive) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
    UIService.openToast("Message envoyé", "success");
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/80">
      <View
        className="w-full max-w-md rounded-t-3xl flex flex-col h-[70vh]"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <View className="flex items-center gap-2">
            <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <Text className="text-white font-bold text-sm">Live Chat</Text>
            <Text className="text-white/40 text-xs flex items-center gap-1">
              <Users size={12} /> {viewerCount}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5"
          >
            <X size={16} className="text-white" />
          </Pressable>
        </View>

        <View
          className="flex-1 overflow-y-auto px-5 py-4 space-y-2"
          style={{  }}
        >
          {messages.length === 0 && (
            <Text className="text-white/30 text-sm text-center py-10">
              Aucun message
            </Text>
          )}
          {messages.map((msg) => (
            <View key={msg.id} className="flex flex-col">
              <View className="flex items-center gap-2">
                <Text className="text-purple-400 text-xs font-medium">
                  {msg.user}
                </Text>
                <Text className="text-white/20 text-[10px]">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text className="text-white/80 text-sm">{msg.text}</Text>
            </View>
          ))}
        </View>

        <View className="px-5 py-4 border-t border-white/8">
          <View className="flex items-center gap-2">
            <TextInput
              value={input}
              onChangeText={(text) => setInput(text)}
              placeholder="Votre message..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder-white/25"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-purple-500 text-white disabled:opacity-40"
            >
              <Send size={16} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
