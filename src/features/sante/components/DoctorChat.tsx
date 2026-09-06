import { Pressable } from "react-native";

// src/features/sante/components/DoctorChat.tsx
import { MessageCircle } from "lucide-react-native";

interface DoctorChatProps {
  onChat: () => void;
  userId?: string;
  disabled?: boolean;
}

export function DoctorChat({
  onChat,
  userId,
  disabled = false,
}: DoctorChatProps) {
  return (
    <Pressable
      onPress={onChat}
      disabled={disabled || !userId}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <MessageCircle size={14} />
      Chat
    </Pressable>
  );
}
