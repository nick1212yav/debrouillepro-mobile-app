import { View, Text } from "react-native";

// src/features/events/components/TicketWallet.tsx
import { Ticket, CheckCircle, Clock, ChevronRight } from "lucide-react-native";

interface TicketItem {
  id: string;
  eventTitle: string;
  eventDate: string;
  ticketNumber: string;
  status: "valid" | "used" | "cancelled";
}

interface Props {
  tickets: TicketItem[];
}

export function TicketWallet({ tickets }: Props) {
  if (tickets.length === 0) {
    return (
      <View className="text-center py-6 text-white/40"><Ticket size={24} className="mx-auto mb-2 text-white/20" /><Text className="text-sm">Aucun billet dans votre portefeuille</Text></View>
    );
  }

  return (
    <View className="space-y-3">{tickets.map((ticket) => (
        <View key={ticket.id} className="rounded-2xl p-4 bg-white/5 border border-white/5 flex items-center gap-3"><View className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/20"><Ticket size={20} className="text-purple-400" /></View><View className="flex-1 min-w-0"><Text className="text-white font-semibold text-sm truncate">{ticket.eventTitle}</Text><Text className="text-white/40 text-xs">{new Date(ticket.eventDate).toLocaleDateString()}</Text></View><View className="text-right"><Text className="text-white/50 text-[10px] font-mono">{ticket.ticketNumber}</Text>{ticket.status === "valid" ? (
              <Text className="text-green-400 text-[10px] flex items-center gap-1">
                <CheckCircle size={10} /> Valide
              </Text>
            ) : ticket.status === "used" ? (
              <Text className="text-amber-400 text-[10px] flex items-center gap-1">
                <Clock size={10} /> Utilisé
              </Text>
            ) : (
              <Text className="text-red-400 text-[10px]">Annulé</Text>
            )}</View></View>
      ))}</View>
  );
}
