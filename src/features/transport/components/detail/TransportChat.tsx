import { View, Text, NativeSyntheticEvent } from "react-native";

// src/features/transport/components/detail/TransportChat.tsx
import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDriverChat } from "../../hooks/useDriverChat";

/* __DEBROUILLEPRO_NATIVE_DOM_API_HELPERS_V8__ — scrollIntoView helper */
const __debrouilleProNativeScrollIntoView = async (ref: { current?: { measure?: (cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) => void } }): Promise<void> => {
  return new Promise((resolve) => {
    ref.current?.measure?.((_x, _y, _w, _h, _px, py) => {
      console.warn('__debrouilleProNativeScrollIntoView: implement scrollTo with pageY on your ScrollView ref');
      resolve();
    });
  });
};


interface TransportChatProps {
  bookingId: string;
  driverName?: string;
}

export function TransportChat({
  bookingId,
  driverName = "Conducteur",
}: TransportChatProps) {
  const { messages, sendMessage } = useDriverChat(bookingId);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<View | null>(null);

  const handleSend = (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  useEffect(() => {
    __debrouilleProNativeScrollIntoView(chatEndRef.current);
  }, [messages]);

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center gap-2"><MessageSquare size={16} className="text-violet-400" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Messagerie de course [2]
        </Text></View>{}<View className="h-48 rounded-2xl bg-black/40 p-3.5 overflow-y-auto space-y-3.5 border border-white/5" style={{  }}>{messages.map((msg) => (
          <View key={msg.id} className={`flex ${msg.sender === "passenger" ? "justify-end" : "justify-start"}`}><View className="space-y-1 max-w-[85%]"><View className={`p-3 rounded-2xl text-[11px] leading-relaxed ${
                  msg.sender === "passenger"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold"
                    : "bg-white/5 text-white/80 border border-white/5 font-semibold"
                }`}>{msg.text}</View><Text className="text-[7px] text-white/30 text-right px-1">{msg.sender === "passenger" ? "Vous" : driverName}</Text></View></View>
        ))}<View ref={chatEndRef} /></View>{}<View className="flex gap-2"><Input value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Écrire un message au chauffeur... [2]" className="flex-1 h-10 rounded-xl bg-white/5 border-white/10 text-xs placeholder:text-white/20" /><Button  size="icon" className="w-10 h-10 rounded-xl bg-violet-600"><Send size={14} className="text-white" /></Button></View></View>
  );
}
