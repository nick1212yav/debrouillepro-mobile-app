import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Compass,
} from "lucide-react-native";

// Imports d'interfaces typées conformes à verbatimModuleSyntax
import type { TableSection } from "../types/enums";

// Imports de l'architecture d'ingénierie du module
import { useReservation } from "../hooks/useReservation";
import { useRestaurant } from "../hooks/useRestaurant";

// Imports des composants de rendu de réservations
import { ReservationForm } from "../components/reservation/ReservationForm";
import { ReservationConfirmation } from "../components/reservation/ReservationConfirmation";

interface RestaurationReservationPageProps {
  restaurantId: number;
  onBack: () => void;
}

export default function RestaurationReservationPage({
  restaurantId,
  onBack,
}: RestaurationReservationPageProps) {
  const { restaurant, loading: loadingRestaurant } =
    useRestaurant(restaurantId);
  const { reserveTable, isProcessing } = useReservation();

  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Correction de la signature de callback (guestsCount s'aligne sur l'interface du formulaire)
  const handleBookingSubmit = async (formData: {
    date: string;
    time: string;
    guestsCount: number; // Modifié pour éliminer l'erreur TS2322
    section: string;
    specialRequest?: string;
  }) => {
    const response = await reserveTable({
      restaurantId,
      userId: "USER_CURRENT_REACTIVE_ID",
      bookingDate: formData.date,
      bookingTime: formData.time,
      guestsCount: formData.guestsCount,
      section: formData.section as TableSection,
      specialRequest: formData.specialRequest,
    });

    if (response.success && response.reservation) {
      setConfirmedBooking(response.reservation);
      UIService.openToast("Votre table a été bloquée avec succès !", "success");
    } else {
      UIService.openToast(response.errors?.global ||
          "Le créneau ou l'espace demandé est complet.", "error");
    }
  };

  if (loadingRestaurant) {
    return (
      <View className="h-full flex items-center justify-center text-white/50 text-xs gap-2">
        <RefreshCw size={14} className="animate-spin" />
        <Text>Vérification des disponibilités avec le maquis...</Text>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View className="h-full flex flex-col items-center justify-center gap-4 text-white/50 text-xs px-4">
        <AlertCircle size={24} className="text-white/20" />
        <Text>Données de l'établissement introuvables.</Text>
        <Pressable
          onPress={onBack}
          className="px-4 py-2 bg-white/5 rounded-xl text-white"
        >
          <Text>Retour</Text></Pressable>
      </View>
    );
  }

  return (
    <View className="h-full w-full flex flex-col relative text-white bg-[#020617]">
      <View className="flex-shrink-0 px-4 pt-12 pb-3 bg-slate-950/60 border-b border-white/[0.04] flex items-center gap-3">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          <ArrowLeft size={18} />
        </Pressable>
        <View className="flex-1 text-left">
          <Text className="block text-[8px] text-white/30 uppercase font-black">
            Service de table
          </Text>
          <Text className="text-sm font-black text-white/95 leading-none mt-1">
            Réservez chez {restaurant.name}
          </Text>
        </View>
      </View>

      <View className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        <>
          {confirmedBooking ? (
            <View
              key="confirmation"
              className="space-y-4"
            >
              <ReservationConfirmation
                bookingId={confirmedBooking.id}
                tableNumber={confirmedBooking.tableNumber}
                restaurantName={restaurant.name}
                date={confirmedBooking.bookingDate}
                time={confirmedBooking.bookingTime}
                guestsCount={confirmedBooking.guestsCount}
                section={confirmedBooking.section}
                onClose={onBack}
              />

              <Pressable
               
                onPress={onBack}
                className="w-full py-4 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10"
              >
                <ShieldCheck size={14} /> <Text>Retour à l'établissement</Text></Pressable>
            </View>
          ) : (
            <View
              key="form"
              className="space-y-4"
            >
              <View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-left flex items-start gap-3">
                <Compass
                  size={18}
                  className="text-emerald-400 shrink-0 mt-0.5 animate-pulse"
                />
                <View>
                  <Text className="block text-xs font-extrabold text-emerald-400">
                    <Text>Planification Instantanée</Text></Text>
                  <Text className="text-[11px] text-white/50 leading-relaxed mt-1 font-normal">
                    <Text>Réservez votre table gratuitement sans intermédiaire. Un SMS de confirmation avec votre numéro de table dédié vous sera envoyé dès enregistrement.</Text></Text>
                </View>
              </View>

              <ReservationForm
                onSubmit={handleBookingSubmit}
                isSubmitting={isProcessing}
              />
            </View>
          )}
        </>
      </View>
    </View>
  );
}
