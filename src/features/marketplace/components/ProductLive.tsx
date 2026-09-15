import { Pressable, Image, View, Text, TextInput } from "react-native";

// src/features/marketplace/components/ProductLive.tsx
import { useState } from "react";
import { Radio, X, Users, Heart, Send } from "lucide-react-native";

interface Props {
  streamUrl: string;
  title: string;
  viewerCount: number;
  isLive: boolean;
}

export function ProductLive({ streamUrl, title, viewerCount, isLive }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (!isLive) return null;

  return (
    <>
      <Pressable onPress={() => setIsOpen(true)} className="relative rounded-2xl overflow-hidden aspect-video w-full group"><Image className="w-full h-full object-cover" source={{ uri: `https://via.placeholder.com/800x450/1a0a2e/8B5CF6?text=🔴+${encodeURIComponent(title)}` }} accessibilityLabel={title} /><View className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors"><View className="text-center"><View className="w-16 h-16 rounded-full bg-red-500/30 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 animate-pulse"><Radio size={28} className="text-white" /></View><Text className="text-white font-bold text-sm">Live maintenant
            </Text><View className="flex items-center gap-2 justify-center mt-1 text-xs text-white/60"><Users size={12} />{viewerCount}<Text>spectateurs</Text></View></View></View><View className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-500/90 px-2 py-0.5 rounded-full"><View className="w-2 h-2 rounded-full bg-white animate-pulse" /><Text className="text-white text-[10px] font-bold">LIVE</Text></View></Pressable>

      {isOpen && (
        <View className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4"><Pressable onPress={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/70 transition-colors z-10"><X size={28} /></Pressable><View className="flex-1 flex items-center justify-center"><View className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50"><Image className="w-full h-full object-cover opacity-50" source={{ uri: `https://via.placeholder.com/800x450/1a0a2e/8B5CF6?text=🔴+${encodeURIComponent(title)}` }} accessibilityLabel={title} /><View className="absolute inset-0 flex items-center justify-center"><View className="text-center"><View className="w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center mx-auto mb-3 animate-pulse"><Radio size={32} className="text-white" /></View><Text className="text-white font-bold text-xl">{title}</Text><Text className="text-white/40 text-sm">Live en cours</Text></View></View><View className="absolute bottom-4 left-4 flex items-center gap-2 text-white/60 text-sm"><Users size={14} />{viewerCount}<Text>spectateurs</Text></View><View className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2"><TextInput value={message} onChangeText={(value) => setMessage(value)} placeholder="Message..." className="bg-transparent text-white text-sm outline-none placeholder-white/30 w-32" onKeyPress={(e) => e.nativeEvent.key === "Enter" && setMessage("")} /><Send size={14} className="text-white/40" /></View></View></View></View>
      )}
    </>
  );
}
