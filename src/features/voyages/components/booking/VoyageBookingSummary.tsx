import { View, Text } from "react-native";

// src/features/voyages/components/booking/VoyageBookingSummary.tsx
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
} from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageBookingSummaryProps {
  trip: VoyageTrip;
  selectedSeats: string[];
  passengerName: string;
  totalPrice: number;
}

export function VoyageBookingSummary({
  trip,
  selectedSeats,
  passengerName,
  totalPrice,
}: VoyageBookingSummaryProps) {
  const departureDate = new Date(trip.departureDate);
  const formattedDate = departureDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-white font-bold text-sm mb-3">Résumé du voyage</Text><View className="space-y-2 text-sm"><View className="flex items-start gap-2"><MapPin size={14} className="text-indigo-400 mt-0.5" /><View><Text className="text-white/50">Trajet</Text><Text className="text-white font-medium">{trip.from}{" "}<ArrowRight size={12} className="inline text-indigo-400" />{" "}{trip.to}</Text></View></View><View className="flex items-start gap-2"><Calendar size={14} className="text-indigo-400 mt-0.5" /><View><Text className="text-white/50">Date</Text><Text className="text-white font-medium">{formattedDate}</Text></View></View><View className="flex items-start gap-2"><Clock size={14} className="text-indigo-400 mt-0.5" /><View><Text className="text-white/50">Heures</Text><Text className="text-white font-medium">{trip.departure}→ {trip.arrival}</Text></View></View><View className="flex items-start gap-2"><Users size={14} className="text-indigo-400 mt-0.5" /><View><Text className="text-white/50">Passager</Text><Text className="text-white font-medium">{passengerName}</Text></View></View><View className="flex items-start gap-2"><ArmchairIcon size={14} className="text-indigo-400 mt-0.5" /><View><Text className="text-white/50">Sièges</Text><Text className="text-white font-medium">{selectedSeats.join(", ")}</Text></View></View></View></View>

      <View className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20"><View className="flex items-center justify-between"><Text className="text-white/60 text-sm">Total à payer</Text><Text className="text-white font-bold text-xl">{totalPrice.toLocaleString()}{trip.currency || "FCFA"}</Text></View><Text className="text-white/30 text-xs mt-1">{selectedSeats.length}siège{selectedSeats.length > 1 ? "s" : ""}×{" "}{trip.price?.toLocaleString()}{trip.currency || "FCFA"}</Text></View>
    </View>
  );
}

function ArmchairIcon({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
      <path d="M3 16v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M3 9h18v7H3z" />
      <path d="M7 9v7" />
      <path d="M17 9v7" />
    </svg>
  );
}
