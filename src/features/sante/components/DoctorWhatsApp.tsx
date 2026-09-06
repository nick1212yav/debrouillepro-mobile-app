import { Pressable, Linking } from "react-native";

// src/features/sante/components/DoctorWhatsApp.tsx
import { MessageCircle } from "lucide-react-native";

interface DoctorWhatsAppProps {
  phone?: string;
  onWhatsApp?: () => void;
}

export function DoctorWhatsApp({ phone, onWhatsApp }: DoctorWhatsAppProps) {
  const handleClick = () => {
    if (onWhatsApp) {
      onWhatsApp();
    } else if (phone) {
      const url = `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
      Linking.openURL(String(url));
    }
  };

  return (
    <Pressable
      onPress={handleClick}
      disabled={!phone}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <MessageCircle size={14} />
      WhatsApp
    </Pressable>
  );
}
