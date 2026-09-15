import { View, Text, Image, Pressable } from "react-native";
import { useState } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Check,
  X,
  ChevronRight,
} from "lucide-react-native";
import { useNavigate } from "react-router-dom";

interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  location: string;
  coverImage?: string;
  maxAttendees?: number;
  isFree: boolean;
  price?: string;
  tags: string[];
  status: "upcoming" | "ongoing" | "past" | "cancelled";
  attendeeCount: number;
  isAttending: boolean;
}

interface Props {
  events: Event[];
  onAttend: (eventId: string) => Promise<void>;
  onUnattend: (eventId: string) => Promise<void>;
  onEventClick?: (eventId: string) => void;
}

const STATUS_LABELS = {
  upcoming: { label: "À venir", color: "#10B981" },
  ongoing: { label: "En cours", color: "#F59E0B" },
  past: { label: "Passé", color: "#6B7280" },
  cancelled: { label: "Annulé", color: "#EF4444" },
};

export function CommunityEvents({
  events,
  onAttend,
  onUnattend,
  onEventClick,
}: Props) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAttend = async (eventId: string, isAttending: boolean) => {
    setIsLoading(eventId);
    try {
      if (isAttending) {
        await onUnattend(eventId);
      } else {
        await onAttend(eventId);
      }
    } catch {
      // erreur gérée par le parent
    } finally {
      setIsLoading(null);
    }
  };

  const handleClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    } else {
      navigate(`/events/${eventId}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (events.length === 0) {
    return (
      <View className="p-4 text-center bg-white/5 rounded-2xl border border-white/5"><Calendar size={32} className="text-white/20 mx-auto mb-2" /><Text className="text-white/30 text-sm">Aucun événement</Text></View>
    );
  }

  return (
    <View className="space-y-3"><View className="flex items-center gap-2"><Calendar size={16} className="text-white/30" /><Text className="text-sm font-medium text-white/50">Événements</Text></View>{events.map((event) => {
        const status = STATUS_LABELS[event.status];
        const isPast = event.status === "past" || event.status === "cancelled";

        return (
          <View key={event._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onPress={() => handleClick(event._id)} className="rounded-2xl overflow-hidden bg-white/5 border border-white/8 transition-colors">
            <View className="flex gap-3 p-3">{}{event.coverImage ? (
                <View className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden"><Image className="w-full h-full object-cover" source={{ uri: event.coverImage }} accessibilityLabel={event.title} /></View>
              ) : (
                <View className="flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center bg-purple-500/20"><Calendar size={24} className="text-purple-400" /></View>
              )}<View className="flex-1 min-w-0"><View className="flex items-start justify-between gap-2"><View><Text className="text-white font-medium text-sm truncate">{event.title}</Text><Text className="text-white/40 text-xs truncate">{event.category}</Text></View><Text className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: `${status.color}20`, color: status.color }}>{status.label}</Text></View><View className="mt-1 space-y-0.5"><View className="flex items-center gap-1 text-xs text-white/30"><Clock size={10} /><Text>{formatDate(event.startDate)}</Text>{event.endDate && (
                      <>
                        <Text className="text-white/20">→</Text>
                        <Text>{new Date(event.endDate).toLocaleDateString()}</Text>
                      </>
                    )}</View><View className="flex items-center gap-1 text-xs text-white/30"><MapPin size={10} /><Text className="truncate">{event.location}</Text></View><View className="flex items-center gap-3 text-xs text-white/30"><Text className="flex items-center gap-1"><Users size={10} />{event.attendeeCount}/{event.maxAttendees || "∞"}</Text><Text>{event.isFree ? "Gratuit" : event.price || "Payant"}</Text></View></View>{!isPast && (
                  <View className="mt-1.5">
                    <Pressable onPress={(e) => {
                        handleAttend(event._id, event.isAttending);
                      }} disabled={isLoading === event._id} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        event.isAttending
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      }`}>
                      {isLoading === event._id
                        ? "..."
                        : event.isAttending
                          ? "✓ Participant"
                          : "Participer"}
                    </Pressable>
                  </View>
                )}</View></View>
          </View>
        );
      })}</View>
  );
}
