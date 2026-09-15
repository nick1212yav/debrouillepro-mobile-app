import { Pressable, View } from "react-native";

// src/features/marketplace/components/SellerContact.tsx
import { MessageCircle, Phone, Mail } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  onChat?: () => void;
  onCall?: () => void;
  onEmail?: () => void;
}

export function SellerContact({ onChat, onCall, onEmail }: Props) {
  return (
    <View className="flex items-center gap-2">
      {onChat && (
        <Pressable onPress={onChat} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-white" style={{ backgroundColor: "rgba(99,102,241,0.15)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}>
          <MessageCircle size={14} /> Chat
        </Pressable>
      )}
      {onCall && (
        <Pressable onPress={onCall} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-white" style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
          <Phone size={14} /> Appeler
        </Pressable>
      )}
      {onEmail && (
        <Pressable onPress={onEmail} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium text-white" style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.2)", borderStyle: "solid" }}>
          <Mail size={14} /> Email
        </Pressable>
      )}
    </View>
  );
}
