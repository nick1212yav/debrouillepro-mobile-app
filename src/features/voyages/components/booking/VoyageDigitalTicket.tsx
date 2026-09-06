import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text } from "react-native";

// src/features/voyages/components/booking/VoyageDigitalTicket.tsx
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  QrCode,
  Download,
  Share2,
  ArrowRight,
} from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageDigitalTicketProps {
  trip: VoyageTrip;
  selectedSeats: string[];
  passengerName: string;
  bookingId: string;
  onClose?: () => void;
}

export function VoyageDigitalTicket({
  trip,
  selectedSeats,
  passengerName,
  bookingId,
  onClose,
}: VoyageDigitalTicketProps) {
  const departureDate = new Date(trip.departureDate);
  const formattedDate = departureDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Générer un QR code simulé (à remplacer par un vrai QR code)
  const qrData = `DP-TICKET-${bookingId}-${trip._id}-${selectedSeats.join("")}`;

  return (
    <View
      className="w-full max-w-md mx-auto"
    >
      <View className="relative bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-white/10 rounded-3xl p-6">
        {/* Entête */}
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="text-xs text-white/40">DÉBROUILLEPRO</Text>
            <Text className="text-white font-bold text-lg">Billet de voyage</Text>
          </View>
          <View className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Text className="text-2xl">✈️</Text>
          </View>
        </View>

        {/* Route */}
        <View className="flex items-center justify-between gap-2 py-3 border-y border-white/10">
          <View className="text-center">
            <Text className="text-white font-black text-xl">{trip.from}</Text>
            <Text className="text-white/40 text-xs">{trip.departure}</Text>
          </View>
          <View className="flex flex-col items-center">
            <View className="w-16 h-0.5 bg-indigo-400/30" />
            <View className="flex items-center gap-1 mt-1 text-xs text-white/30">
              <ArrowRight size={10} />
            </View>
            <View className="w-16 h-0.5 bg-indigo-400/30" />
          </View>
          <View className="text-center">
            <Text className="text-white font-black text-xl">{trip.to}</Text>
            <Text className="text-white/40 text-xs">{trip.arrival}</Text>
          </View>
        </View>

        {/* Informations */}
        <View className="py-4 space-y-2 text-sm">
          <View className="flex items-center gap-2">
            <MapPin size={14} className="text-indigo-400" />
            <Text className="text-white/60">Opérateur</Text>
            <Text className="text-white font-medium ml-auto">
              {trip.operator}
            </Text>
          </View>
          <View className="flex items-center gap-2">
            <Calendar size={14} className="text-indigo-400" />
            <Text className="text-white/60">Date</Text>
            <Text className="text-white font-medium ml-auto">
              {formattedDate}
            </Text>
          </View>
          <View className="flex items-center gap-2">
            <Users size={14} className="text-indigo-400" />
            <Text className="text-white/60">Passager</Text>
            <Text className="text-white font-medium ml-auto">
              {passengerName}
            </Text>
          </View>
          <View className="flex items-center gap-2">
            <Text className="text-indigo-400">🪑</Text>
            <Text className="text-white/60">Sièges</Text>
            <Text className="text-white font-medium ml-auto">
              {selectedSeats.join(", ")}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View className="flex flex-col items-center py-4 border-t border-white/10">
          <View className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center">
            <QrCode size={80} className="text-black" />
            {/* Ici, on pourrait générer un vrai QR code avec qrcode.react */}
          </View>
          <Text className="text-white/30 text-[10px] mt-2">
            Scannez ce QR code pour l'embarquement
          </Text>
          <Text className="text-white/20 text-[8px] mt-1">ID: {qrData}</Text>
        </View>

        {/* Actions */}
        <View className="flex gap-3 mt-4">
          <Pressable
            onPress={() => {
              // Télécharger le billet (à implémenter)
              UIService.openToast("Téléchargement du billet", "info");
            }}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 flex items-center justify-center gap-2"
          >
            <Download size={14} />
            <Text>Télécharger</Text></Pressable>
          <Pressable
            onPress={() => {
              // Partager le billet
              undefined;
            }}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 border border-white/10 flex items-center justify-center gap-2"
          >
            <Share2 size={14} />
            <Text>Partager</Text></Pressable>
        </View>

        {onClose && (
          <Pressable
            onPress={onClose}
            className="mt-3 w-full py-2 rounded-xl text-sm font-medium text-white/40 bg-white/5 border border-white/10"
          >
            <Text>Fermer</Text></Pressable>
        )}
      </View>
    </View>
  );
}
