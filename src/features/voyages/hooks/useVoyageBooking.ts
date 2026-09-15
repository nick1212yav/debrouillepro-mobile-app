// src/features/voyages/hooks/useVoyageBooking.ts
import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export interface Passenger {
  name: string;
  phone?: string;
  email?: string;
}

export interface BookingState {
  tripId: Id<"trips"> | null;
  seats: number;
  seatNumbers: string[];
  passenger: Passenger;
  step: "form" | "summary" | "payment" | "success";
}

/**
 * Gère le tunnel de réservation d'un voyage.
 */
export function useVoyageBooking() {
  const bookTrip = useMutation(api.voyages.bookTrip);
  const [state, setState] = useState<BookingState>({
    tripId: null,
    seats: 1,
    seatNumbers: [],
    passenger: { name: "" },
    step: "form",
  });

  const startBooking = useCallback((tripId: Id<"trips">) => {
    setState((prev) => ({
      ...prev,
      tripId,
      step: "form",
      seats: 1,
      seatNumbers: [],
      passenger: { name: "" },
    }));
  }, []);

  const setPassenger = useCallback((passenger: Passenger) => {
    setState((prev) => ({ ...prev, passenger }));
  }, []);

  const setSeats = useCallback((seats: number, seatNumbers: string[]) => {
    setState((prev) => ({ ...prev, seats, seatNumbers }));
  }, []);

  const goToSummary = useCallback(() => {
    if (!state.passenger.name.trim()) {
      toast.error("Veuillez saisir le nom du passager");
      return;
    }
    setState((prev) => ({ ...prev, step: "summary" }));
  }, [state.passenger]);

  const goToPayment = useCallback(() => {
    setState((prev) => ({ ...prev, step: "payment" }));
  }, []);

  const confirmBooking = useCallback(async () => {
    if (!state.tripId) {
      toast.error("Aucun voyage sélectionné");
      return;
    }

    try {
      await bookTrip({
        tripId: state.tripId,
        seats: state.seats,
        seatNumbers: state.seatNumbers,
        passengerName: state.passenger.name,
        passengerPhone: state.passenger.phone, // Transmis conformément au schéma
        // ✅ Correction : 'passengerEmail' a été retiré pour s'adapter strictement aux arguments du schéma Convex [1]
      });

      setState((prev) => ({ ...prev, step: "success" }));
      toast.success("Réservation confirmée !");
      return true;
    } catch {
      toast.error("Erreur lors de la réservation");
      return false;
    }
  }, [state, bookTrip]);

  const reset = useCallback(() => {
    setState({
      tripId: null,
      seats: 1,
      seatNumbers: [],
      passenger: { name: "" },
      step: "form",
    });
  }, []);

  return {
    ...state,
    startBooking,
    setPassenger,
    setSeats,
    goToSummary,
    goToPayment,
    confirmBooking,
    reset,
  };
}
