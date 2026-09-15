import { View, Text, Pressable, TextInput } from "react-native";

// src/features/marketplace/components/SellerChat.tsx
import { useState } from "react";
import { Send, X } from "lucide-react-native";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  sender: "user" | "seller";
  timestamp: number;
}

interface Props {
  sellerName: string;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<void>;
  initialMessages?: Message[];
}

export function SellerChat({
  sellerName,
  onClose,
  onSendMessage,
  initialMessages = [],
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSendMessage(input);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: input,
          sender: "user",
          timestamp: Date.now(),
        },
      ]);
      setInput("");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"><View className="w-full max-w-md rounded-t-3xl flex flex-col h-[70vh]" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between px-5 py-4 border-b border-white/8"><Text className="text-white font-bold text-lg">Chat avec {sellerName}</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5"><X size={16} className="text-white" /></Pressable></View><View className="flex-1 overflow-y-auto px-5 py-4 space-y-2" style={{  }}>{messages.length === 0 && (
            <Text className="text-white/30 text-sm text-center py-10">Commencez la conversation
            </Text>
          )}{messages.map((msg) => (
            <View key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}><View className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === "user" ? "bg-purple-500/20 text-white" : "bg-white/5 text-white/80"}`}>{msg.text}<Text className="text-[10px] text-white/30 mt-0.5">{new Date(msg.timestamp).toLocaleTimeString()}</Text></View></View>
          ))}</View><View className="px-5 py-4 border-t border-white/8"><View className="flex items-center gap-2"><TextInput value={input} onChangeText={(value) => setInput(value)} placeholder="Votre message..." className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/25" onKeyPress={(e) => e.nativeEvent.key === "Enter" && handleSend()} /><Pressable onPress={handleSend} disabled={!input.trim() || sending} className="p-3 rounded-xl bg-purple-500 text-white disabled:opacity-40"><Send size={16} /></Pressable></View></View></View></View>
  );
}
