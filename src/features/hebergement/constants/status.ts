import type { BookingStatusType } from "../types/booking.types";

export interface BookingStatusConstant {
  id: BookingStatusType;
  label: string;
  color: string;
}

export const BOOKING_STATUSES: BookingStatusConstant[] = [
  {
    id: "pending",
    label: "En attente",
    color: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  },
  {
    id: "confirmed",
    label: "Confirmée",
    color: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
  },
  {
    id: "cancelled",
    label: "Annulée",
    color: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
  },
  {
    id: "completed",
    label: "Terminée",
    color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  },
  {
    id: "rejected",
    label: "Refusée",
    color: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
  },
];
