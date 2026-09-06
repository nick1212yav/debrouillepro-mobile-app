// src/features/transport/hooks/useBookings.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { TransportBooking } from "../types";

export function useBookings() {
  const bookings = useQuery(api.mobility.getMyTransportBookings, {});

  return {
    bookings: bookings as TransportBooking[] | undefined,
    isLoading: bookings === undefined,
  };
}
