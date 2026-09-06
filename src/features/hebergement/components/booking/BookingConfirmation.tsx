import { Pressable, View, Text } from "react-native";
import React from "react";
import { CheckCircle, ShieldCheck, ArrowRight } from "lucide-react-native";

interface BookingConfirmationProps {
  bookingId: string;
  accommodationTitle: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  currency?: string;
  onClose: () => void;
  className?: string;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  bookingId,
  accommodationTitle,
  checkIn,
  checkOut,
  totalPrice,
  currency = "FCFA",
  onClose,
  className = "",
}) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View
      className={`p-6 text-center flex flex-col items-center gap-4 ${className}`}
    >
      <View className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 relative">
        <Text className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-60" />
        <CheckCircle size={32} className="stroke-[2.5]" />
      </View>

      <View className="flex flex-col gap-1">
        <Text className="text-lg font-black text-white">
          Réservation Confirmée !
        </Text>
        <Text className="text-xs text-white/50">
          Votre séjour a été enregistré avec succès.
        </Text>
        <Text className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">
          Référence : {bookingId}
        </Text>
      </View>

      <View className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 text-left mt-2">
        <View className="flex flex-col">
          <Text className="text-[9px] text-white/40 uppercase font-bold tracking-wider">
            Hébergement
          </Text>
          <Text className="text-xs font-semibold text-white truncate">
            {accommodationTitle}
          </Text>
        </View>

        <View className="gap-4 pt-3 border-t border-white/5">
          <View className="flex flex-col">
            <Text className="text-[9px] text-white/40 uppercase font-bold tracking-wider">
              Arrivée
            </Text>
            <Text className="text-xs font-medium text-white">
              {formatDate(checkIn)}
            </Text>
          </View>
          <View className="flex flex-col">
            <Text className="text-[9px] text-white/40 uppercase font-bold tracking-wider">
              Départ
            </Text>
            <Text className="text-xs font-medium text-white">
              {formatDate(checkOut)}
            </Text>
          </View>
        </View>

        <View className="pt-3 border-t border-white/5 flex justify-between items-center">
          <Text className="text-xs text-white/50">Total réglé</Text>
          <Text className="text-sm font-black text-emerald-400">
            {new Intl.NumberFormat("fr-FR").format(totalPrice)} {currency}
          </Text>
        </View>
      </View>

      <View className="flex items-center gap-1 text-white/30 text-[9px] mt-1">
        <ShieldCheck size={11} className="text-emerald-400" />
        <Text><Text>Garantie de réservation DébrouillePro</Text></Text>
      </View>

      <Pressable
        onPress={onClose}
        className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 mt-3"
      >
        <Text><Text>Retour aux hébergements</Text></Text>
        <ArrowRight size={14} />
      </Pressable>
    </View>
  );
};
