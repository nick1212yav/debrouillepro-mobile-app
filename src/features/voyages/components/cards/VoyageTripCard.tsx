import { Pressable, View, Image, Text } from "react-native";

// src/features/voyages/components/cards/VoyageTripCard.tsx
import { Clock, Users, ArrowRight } from "lucide-react-native";
import type { VoyageTrip } from "../../types/voyage.types";
import { VoyageBadge } from "../common/VoyageBadge";
import { VoyagePrice } from "../common/VoyagePrice";
import { VoyageRating } from "../common/VoyageRating";

// ─── Props ──────────────────────────────────────────────────────────────────

interface VoyageTripCardProps {
  trip?: VoyageTrip;
  publication?: any; // Pour les publications du feed
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
  // Permet d'accepter des props supplémentaires (index, etc.)
  [key: string]: any;
}

// ─── Composant principal ────────────────────────────────────────────────────

export function VoyageTripCard({
  trip: propTrip,
  publication,
  onClick,
}: VoyageTripCardProps) {
  // Si le trip est passé via publication.meta (cas du feed), on le parse
  const trip =
    propTrip || (publication?.meta ? JSON.parse(publication.meta) : null);

  const tripColor = trip?.color || "#6366f1";

  // Utilisation directe de l'URL déjà résolue par le backend
  const imageUrl =
    typeof trip?.imageUrl === "string" && trip.imageUrl.length > 0
      ? trip.imageUrl
      : null;

  if (!trip) return null;

  const getOccupancyPct = () => {
    const total = trip.totalSeats || 1;
    const available = trip.availableSeats ?? 0;
    return Math.round(((total - available) / total) * 100);
  };

  const occupancy = getOccupancyPct();

  return (
    <Pressable whileTap={{ scale: 0.98 }} onPress={onClick} className="w-full text-left bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col">
      {/* Bannière de trajet */}
      <View className="relative h-28 w-full overflow-hidden bg-white/[0.01]">{imageUrl ? (
          <Image className="w-full h-full object-cover opacity-60" source={{ uri: imageUrl }} accessibilityLabel={`${trip.from} → ${trip.to}`} />
        ) : (
          <View className="w-full h-full bg-gradient-to-r from-blue-900/10 to-indigo-900/10" />
        )}<View className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" /><View className="absolute top-3 left-3 flex items-center gap-2"><Text className="text-xs font-bold text-white/80">{trip.operator}</Text></View><View className="absolute top-3 right-3"><VoyageRating rating={trip.rating} reviewCount={trip.reviewCount} /></View><View className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: tripColor + "20", borderStyle: "solid" }}>{trip.type}</View></View>

      <View className="p-4 flex-1 flex flex-col justify-between gap-3 w-full">{}<View className="flex items-center justify-between gap-2"><View><Text className="text-lg font-bold text-white leading-none">{trip.departure}</Text><Text className="text-[10px] text-white/40 mt-1">{trip.from}</Text></View><View className="flex-1 mx-2 flex flex-col items-center gap-1.5"><View className="flex items-center gap-1 text-[10px] text-white/30"><Clock size={10} /><Text>{Math.floor(trip.durationMinutes / 60)}h
                {String(trip.durationMinutes % 60).padStart(2, "0")}</Text></View><View className="relative w-full h-px bg-white/10 flex items-center justify-center"><ArrowRight size={10} className="text-white/20 absolute" /></View></View><View className="text-right"><Text className="text-lg font-bold text-white leading-none">{trip.arrival}</Text><Text className="text-[10px] text-white/40 mt-1">{trip.to}</Text></View></View>{}<View className="flex items-center gap-1.5 flex-wrap">{trip.amenities.slice(0, 3).map((a: string) => (
            <VoyageBadge key={a} variant="secondary">
              {a}
            </VoyageBadge>
          ))}</View>{}<View className="flex items-center justify-between pt-2 border-t border-white/5 w-full"><VoyagePrice price={trip.price} currency={trip.currency} variant="small" /><View className="flex items-center gap-2"><View className="flex items-center gap-1 text-[10px] text-white/40"><Users size={11} /><Text>{trip.availableSeats}places</Text></View><View className="w-12 h-1 bg-white/10 rounded-full overflow-hidden"><View className="h-full rounded-full transition-all" style={{ width: `${occupancy}%`, backgroundColor: occupancy > 80
                                ? "#ef4444"
                                : occupancy > 50
                                  ? "#f97316"
                                  : "#10b981" }} /></View></View></View></View>
    </Pressable>
  );
}

export { VoyageTripCard as VoyageCard };
