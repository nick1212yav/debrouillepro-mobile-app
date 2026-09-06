import { Pressable, View, Text } from "react-native";

// src/features/voyages/components/booking/VoyageBookingSuccess.tsx
import {
  CheckCircle,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageBookingSuccessProps {
  trip: VoyageTrip;
  selectedSeats: string[];
  passengerName: string;
  bookingId: string;
  onClose: () => void;
}

export function VoyageBookingSuccess({
  trip,
  selectedSeats,
  passengerName,
  bookingId,
  onClose,
}: VoyageBookingSuccessProps) {
  const departureDate = new Date(trip.departureDate);
  const formattedDate = departureDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <View
      className="flex flex-col items-center text-center"
    >
      <View className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
        <CheckCircle size={32} className="text-emerald-400" />
      </View>

      <Text className="text-white font-bold text-xl">Réservation confirmée !</Text>
      <Text className="text-white/60 text-sm mt-1">
        Votre voyage est maintenant réservé.
      </Text>

      <View className="w-full mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2">
        <View className="flex items-center gap-2 text-xs text-white/40">
          <Ticket size={14} className="text-indigo-400" />
          <Text>Référence : {bookingId}</Text>
        </View>

        <View className="flex items-center gap-2 text-sm">
          <MapPin size={14} className="text-indigo-400" />
          <Text className="text-white font-medium">
            {trip.from}{" "}
            <ArrowRight size={12} className="inline text-indigo-400" />{" "}
            {trip.to}
          </Text>
        </View>

        <View className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-indigo-400" />
          <Text className="text-white">{formattedDate}</Text>
        </View>

        <View className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-indigo-400" />
          <Text className="text-white">
            {trip.departure} → {trip.arrival}
          </Text>
        </View>

        <View className="flex items-center gap-2 text-sm">
          <Users size={14} className="text-indigo-400" />
          <Text className="text-white">
            {passengerName} <Text>(Sièges</Text>{selectedSeats.join(", ")}<Text>)</Text></Text>
        </View>
      </View>

      <View className="mt-6 flex gap-3 w-full">
        <Pressable
          onPress={onClose}
          className="flex-1 py-3 rounded-2xl text-sm font-medium text-white/60 bg-white/5 border border-white/10"
        >
          Terminer
        </Pressable>
        <Pressable
          onPress={() => (undefined.href = `/voyages/${trip._id}/ticket`)}
          className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500"
        >
          Voir mon billet
        </Pressable>
      </View>
    </View>
  );
}
