import { View, Text, Pressable } from "react-native";
import { CheckCircle, Calendar, Users, MapPin, X } from "lucide-react-native";

interface ReservationConfirmationProps {
  bookingId: string;
  tableNumber: number;
  restaurantName: string;
  date: string;
  time: string;
  guestsCount: number;
  section: string;
  onClose: () => void;
}

export function ReservationConfirmation({
  bookingId,
  tableNumber,
  restaurantName,
  date,
  time,
  guestsCount,
  section,
  onClose,
}: ReservationConfirmationProps) {
  const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const sectionLabel =
    {
      standard: "Salle Standard",
      terrace: "Terrasse",
      vip: "Espace VIP",
      private_room: "Salon Privé",
    }[section] || "Salle Standard";

  return (
    <View className="p-5 rounded-3xl bg-white/[0.01] border border-white/[0.06] text-left space-y-4 relative overflow-hidden">
      {/* Effet lumineux de fond */}
      <View className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-emerald-500/10" />

      <View className="flex justify-between items-start">
        <View className="flex items-center gap-2 text-emerald-400">
          <CheckCircle size={18} />
          <Text className="text-sm font-black uppercase tracking-wider">
            Réservation de table confirmée
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50"
        >
          <X size={15} />
        </Pressable>
      </View>

      <View className="space-y-1 py-1">
        <Text className="text-lg font-black text-white">{restaurantName}</Text>
        <Text className="text-[10px] text-white/40 block font-mono">
          CODE RÉSERVATION : {bookingId}
        </Text>
      </View>

      <View className="gap-3 py-3 border-t border-b border-white/[0.06] text-xs text-white/80">
        <View className="flex items-center gap-2">
          <Calendar size={14} className="text-emerald-400 shrink-0" />
          <View>
            <Text className="block text-[8px] text-white/30 uppercase font-bold">
              Date & Heure
            </Text>
            <Text className="font-semibold capitalize">
              {formattedDate} à {time}
            </Text>
          </View>
        </View>

        <View className="flex items-center gap-2">
          <Users size={14} className="text-emerald-400 shrink-0" />
          <View>
            <Text className="block text-[8px] text-white/30 uppercase font-bold">
              Couverts
            </Text>
            <Text className="font-semibold">{guestsCount} invités</Text>
          </View>
        </View>

        <View className="flex items-center gap-2 mt-2">
          <MapPin size={14} className="text-emerald-400 shrink-0" />
          <View>
            <Text className="block text-[8px] text-white/30 uppercase font-bold">
              <Text>Emplacement de Table</Text></Text>
            <Text className="font-bold text-white">
              {sectionLabel} <Text>— Table N°</Text>{tableNumber}
            </Text>
          </View>
        </View>
      </View>

      <Text className="text-[11px] text-white/50 leading-relaxed font-normal">
        <Text>* Une marge de tolérance de 15 minutes vous est accordée après l'heure d'arrivée prévue. Passé ce délai, la table pourra être réaffectée.</Text></Text>
    </View>
  );
}
