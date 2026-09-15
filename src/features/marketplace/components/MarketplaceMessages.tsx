import { View, TextInput, Text, Pressable, Image } from "react-native";

// src/features/marketplace/components/MarketplaceMessages.tsx
import { useState } from "react";
import { Search, MessageCircle, User, Clock } from "lucide-react-native";
import { formatDate } from "../utils/formatter";

interface Conversation {
  id: string;
  buyerName: string;
  buyerAvatar?: string;
  productTitle: string;
  lastMessage: string;
  unread: number;
  lastMessageAt: number;
}

interface Props {
  conversations: Conversation[];
  onSelect: (id: string) => void;
}

export function MarketplaceMessages({ conversations, onSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(
    (c) =>
      c.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      c.productTitle.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="space-y-3"><View className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10"><Search size={14} className="text-white/40" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Rechercher une conversation..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/30" /></View><View className="space-y-2">{filtered.length === 0 ? (
          <Text className="text-white/30 text-sm text-center py-4">Aucun message
          </Text>
        ) : (
          filtered.map((conv) => (
            <Pressable key={conv.id} onPress={() => onSelect(conv.id)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-colors text-left">{conv.buyerAvatar ? (
                <Image className="w-10 h-10 rounded-full object-cover" source={{ uri: conv.buyerAvatar }} accessibilityLabel={conv.buyerName} />
              ) : (
                <View className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400"><User size={16} /></View>
              )}<View className="flex-1 min-w-0"><View className="flex items-center justify-between"><Text className="text-white font-medium text-sm">{conv.buyerName}</Text><Text className="text-white/30 text-[10px] flex items-center gap-0.5"><Clock size={10} />{formatDate(conv.lastMessageAt)}</Text></View><Text className="text-white/60 text-xs truncate">{conv.productTitle}</Text><Text className="text-white/40 text-xs truncate">{conv.lastMessage}</Text></View>{conv.unread > 0 && (
                <View className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {conv.unread}
                </View>
              )}</Pressable>
          ))
        )}</View></View>
  );
}
