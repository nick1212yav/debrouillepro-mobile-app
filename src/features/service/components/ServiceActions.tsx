import { Pressable, View } from "react-native";
import {
  Phone,
  MessageCircle,
  Calendar,
  FileText,
  CreditCard,
  Zap,
} from "lucide-react-native";

interface Props {
  onCall?: () => void;
  onWhatsApp?: () => void;
  onMessage?: () => void;
  onBook?: () => void;
  onQuote?: () => void;
  onPay?: () => void;
  onUrgent?: () => void;
}

export function ServiceActions({
  onCall,
  onWhatsApp,
  onMessage,
  onBook,
  onQuote,
  onPay,
  onUrgent,
}: Props) {
  return (
    <View className="flex flex-wrap gap-2">
      {onCall && (
        <Pressable
          onPress={onCall}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 text-green-400 border border-green-500/20"
        >
          <Phone size={16} /> Appeler
        </Pressable>
      )}
      {onWhatsApp && (
        <Pressable
          onPress={onWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
        >
          <MessageCircle size={16} /> WhatsApp
        </Pressable>
      )}
      {onMessage && (
        <Pressable
          onPress={onMessage}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/20"
        >
          <MessageCircle size={16} /> Message
        </Pressable>
      )}
      {onBook && (
        <Pressable
          onPress={onBook}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/20"
        >
          <Calendar size={16} /> Réserver
        </Pressable>
      )}
      {onQuote && (
        <Pressable
          onPress={onQuote}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/20"
        >
          <FileText size={16} /> Devis
        </Pressable>
      )}
      {onPay && (
        <Pressable
          onPress={onPay}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500"
        >
          <CreditCard size={16} /> Payer
        </Pressable>
      )}
      {onUrgent && (
        <Pressable
          onPress={onUrgent}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/20"
        >
          <Zap size={16} /> Urgence
        </Pressable>
      )}
    </View>
  );
}
