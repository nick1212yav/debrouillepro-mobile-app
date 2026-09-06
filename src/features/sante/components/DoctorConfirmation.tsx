import { View, Text } from "react-native";
// src/features/sante/components/DoctorConfirmation.tsx
import { CheckCircle, Calendar, Clock, User, MapPin } from "lucide-react-native";

export interface AppointmentConfirmation {
  doctorName: string;
  specialty: string;
  date: Date;
  slot: string;
  type: "consultation" | "teleconsultation";
  address?: string;
  paymentStatus: "paid" | "pending";
  amount: number;
  currency: string;
}

interface DoctorConfirmationProps {
  confirmation: AppointmentConfirmation;
  onClose?: () => void;
  onViewDetails?: () => void;
}

export function DoctorConfirmation({
  confirmation,
  onClose,
  onViewDetails,
}: DoctorConfirmationProps) {
  const dateStr = confirmation.date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <View className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center">
      <View className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-400" />
      </View>
      <Text className="text-white text-xl font-bold mb-1">
        Rendez-vous confirmé
      </Text>
      <Text className="text-white/50 text-sm mb-4">
        Votre rendez-vous a été enregistré avec succès
      </Text>

      <View className="space-y-2 text-left p-4 rounded-xl bg-white/5 border border-white/10">
        <View className="flex items-center gap-2 text-sm">
          <User size={14} className="text-white/40" />
          <Text className="text-white font-medium">
            {confirmation.doctorName}
          </Text>
          <Text className="text-white/40">·</Text>
          <Text className="text-white/60">{confirmation.specialty}</Text>
        </View>
        <View className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-white/40" />
          <Text className="text-white/80">{dateStr}</Text>
        </View>
        <View className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-white/40" />
          <Text className="text-white/80">{confirmation.slot}</Text>
        </View>
        {confirmation.address && (
          <View className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-white/40" />
            <Text className="text-white/80">{confirmation.address}</Text>
          </View>
        )}
        <View className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
          <Text className="text-white/40 text-sm">Type</Text>
          <Text className="text-white text-sm font-medium">
            {confirmation.type === "consultation" ? "🏥 Cabinet" : "📹 Visio"}
          </Text>
        </View>
        <View className="flex items-center justify-between">
          <Text className="text-white/40 text-sm">Paiement</Text>
          <Text
            className={`text-sm font-medium ${confirmation.paymentStatus === "paid" ? "text-green-400" : "text-yellow-400"}`}
          >
            {confirmation.paymentStatus === "paid" ? "Payé" : "En attente"}
          </Text>
        </View>
        <View className="flex items-center justify-between">
          <Text className="text-white/40 text-sm">Montant</Text>
          <Text className="text-white font-bold">
            {confirmation.amount} {confirmation.currency}
          </Text>
        </View>
      </View>

      <View className="flex gap-2 mt-4">
        {onViewDetails && (
          <Pressable
            onPress={onViewDetails}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10"
          >
            <Text>Voir détails</Text></Pressable>
        )}
        {onClose && (
          <Pressable
            onPress={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600"
          >
            <Text>Fermer</Text></Pressable>
        )}
      </View>
    </View>
  );
}
