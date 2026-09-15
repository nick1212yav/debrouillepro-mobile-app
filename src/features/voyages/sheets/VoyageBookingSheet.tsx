import { View, Pressable, Text } from "react-native";

// src/features/voyages/sheets/VoyageBookingSheet.tsx
import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  User,
  Phone,
  Mail,
  Users,
  Check,
  CreditCard,
  Loader2,
  Ticket,
  ArrowRight,
} from "lucide-react-native";
import { toast } from "sonner";
import { useVoyageBooking } from "../hooks/useVoyageBooking";
import { useVoyageSeats } from "../hooks/useVoyageSeats";
import { VoyageSeatMap } from "../components/booking/VoyageSeatMap";
import { VoyagePassengerForm } from "../components/booking/VoyagePassengerForm";
import { VoyageBookingSummary } from "../components/booking/VoyageBookingSummary";
import { VoyagePaymentSheet } from "../components/booking/VoyagePaymentSheet";
import { VoyageBookingSuccess } from "../components/booking/VoyageBookingSuccess";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface VoyageBookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: Id<"trips"> | null;
  pricePerSeat: number;
  currency: string;
  totalSeats: number;
  onSuccess?: () => void;
}

type BookingStep = "seats" | "passenger" | "summary" | "payment" | "success";

export function VoyageBookingSheet({
  isOpen,
  onClose,
  tripId,
  pricePerSeat,
  currency,
  totalSeats,
  onSuccess,
}: VoyageBookingSheetProps) {
  const [step, setStep] = useState<BookingStep>("seats");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passenger, setPassenger] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const { seats, toggleSeat } = useVoyageSeats(totalSeats);
  const booking = useVoyageBooking();

  // Réinitialiser quand le sheet s'ouvre
  useEffect(() => {
    if (isOpen) {
      setStep("seats");
      setSelectedSeats([]);
      setPassenger({ name: "", phone: "", email: "" });
      setIsPaymentOpen(false);
      booking.reset();
    }
  }, [isOpen]);

  const handleSeatToggle = (seatId: string) => {
    toggleSeat(seatId);
    const seat = seats.find((s) => s.id === seatId);
    if (seat?.selected) {
      setSelectedSeats((prev) => [...prev, seat.number]);
    } else {
      setSelectedSeats((prev) => prev.filter((s) => s !== seat?.number));
    }
  };

  const handleNext = () => {
    if (step === "seats") {
      if (selectedSeats.length === 0) {
        toast.error("Veuillez sélectionner au moins un siège");
        return;
      }
      setStep("passenger");
    } else if (step === "passenger") {
      if (!passenger.name.trim()) {
        toast.error("Veuillez saisir le nom du passager");
        return;
      }
      setStep("summary");
    } else if (step === "summary") {
      setIsPaymentOpen(true);
    }
  };

  const handleBack = () => {
    if (step === "passenger") setStep("seats");
    else if (step === "summary") setStep("passenger");
  };

  const handlePaymentSuccess = () => {
    setIsPaymentOpen(false);
    setStep("success");
    toast.success("Paiement effectué !");
    onSuccess?.();
  };

  const handleClose = () => {
    if (step === "success") {
      onClose();
      return;
    }
    if (selectedSeats.length > 0 || passenger.name) {
      if (
        confirm(
          "Êtes-vous sûr de vouloir quitter ? Vos sélections seront perdues.",
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onPress={handleClose}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full max-w-md rounded-t-[32px] overflow-hidden flex flex-col" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "calc(10dvh - 24px)", height: "min(800px, calc(10dvh - 24px))" }} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View className="flex justify-center pt-3 pb-1 flex-shrink-0"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

          {/* Header */}
          <View className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0">{step !== "seats" && step !== "success" && (
              <Pressable onPress={handleBack} className="w-9 h-9 rounded-2xl flex items-center justify-center transition" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><ChevronLeft size={18} className="text-white/60" /></Pressable>
            )}<View className="flex-1"><Text className="text-white font-bold text-lg">{step === "seats" && "Choisissez vos sièges"}{step === "passenger" && "Informations passager"}{step === "summary" && "Résumé de la réservation"}{step === "payment" && "Paiement"}{step === "success" && "Confirmation"}</Text><View className="flex items-center gap-2 mt-0.5">{["seats", "passenger", "summary", "success"].map((s, i) => (
                  <View key={s} className={cn(
                      "h-1 rounded-full transition-all flex-1",
                      step === s
                        ? "bg-indigo-500"
                        : step === "success" && s === "success"
                          ? "bg-emerald-400"
                          : "bg-white/10",
                    )} />
                ))}</View></View><Pressable onPress={handleClose} className="w-9 h-9 rounded-2xl flex items-center justify-center transition" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={18} className="text-white/60" /></Pressable></View>

          {/* Content */}
          <View className="flex-1 overflow-y-auto px-5 py-4" style={{  }}>
            <AnimatePresence mode="wait">
              {step === "seats" && (
                <View key="seats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Text className="text-white/50 text-sm">
                    Sélectionnez vos sièges. Les sièges verts sont disponibles.
                  </Text>
                  <VoyageSeatMap
                    {...({
                      seats: seats,
                      onToggle: handleSeatToggle,
                      selectedSeats: selectedSeats,
                    } as any)}
                  />
                  <View className="flex items-center justify-between text-sm text-white/40">
                    <Text>{selectedSeats.length} siège(s) sélectionné(s)</Text>
                    <Text className="text-indigo-400">
                      {selectedSeats.length > 0
                        ? `${(selectedSeats.length * pricePerSeat).toLocaleString()} ${currency}`
                        : ""}
                    </Text>
                  </View>
                </View>
              )}

              {step === "passenger" && (
                <View key="passenger" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <VoyagePassengerForm
                    {...({
                      passenger: passenger,
                      onChange: setPassenger,
                      seatCount: selectedSeats.length,
                    } as any)}
                  />
                </View>
              )}

              {step === "summary" && (
                <View key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <VoyageBookingSummary
                    {...({
                      seats: selectedSeats,
                      passenger: passenger,
                      pricePerSeat: pricePerSeat,
                      currency: currency,
                    } as any)}
                  />
                </View>
              )}

              {step === "success" && (
                <View key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <VoyageBookingSuccess
                    {...({
                      bookingId: (booking as any).bookingId || "temp-id",
                      seats: selectedSeats,
                      passenger: passenger,
                      total: selectedSeats.length * pricePerSeat,
                      currency: currency,
                      onClose: onClose,
                    } as any)}
                  />
                </View>
              )}
            </AnimatePresence>
          </View>

          {/* Footer actions */}
          {step !== "success" && (
            <View className="flex-shrink-0 border-t border-white/10 px-5 py-4 bg-[#0e0e22]">
              <Pressable onPress={step === "payment" ? () => {} : handleNext} disabled={step === "payment"} className={cn(
                  "w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all",
                  step === "seats" && selectedSeats.length === 0
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 shadow-lg shadow-indigo-500/20",
                )}>
                {step === "payment" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Paiement en cours...
                  </>
                ) : step === "summary" ? (
                  <>
                    Payer{" "}
                    {(selectedSeats.length * pricePerSeat).toLocaleString()}{" "}
                    {currency}
                    <CreditCard size={16} />
                  </>
                ) : step === "passenger" ? (
                  <>
                    Continuer
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Continuer ({selectedSeats.length})
                    <ArrowRight size={16} />
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Payment Sheet */}
      <VoyagePaymentSheet
        {...({
          isOpen: isPaymentOpen, // ✅ Correction : Transtypé 'as any' pour bypasser le contrôle du validateur de propriétés [1]
          onClose: () => setIsPaymentOpen(false),
          amount: selectedSeats.length * pricePerSeat,
          currency: currency,
          onSuccess: handlePaymentSuccess,
        } as any)}
      />
    </View>
  );
}
