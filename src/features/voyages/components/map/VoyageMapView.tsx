import { View, Pressable, Text } from "react-native";

// src/features/voyages/components/map/VoyageMapView.tsx
import { MapPin, Map as MapIcon, ArrowRight, Loader2 } from "lucide-react-native";
import type { VoyageTrip } from "../../types";

interface VoyageMapViewProps {
  trip: VoyageTrip;
  isInteractive?: boolean;
  onMapClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * Composant principal de la carte du voyage.
 * Pour l'instant, affiche un placeholder élégant.
 * Plus tard, intégrera MapLibre/Mapbox avec les coordonnées GPS.
 */
export function VoyageMapView({
  trip,
  isInteractive = false,
  onMapClick,
  isLoading = false,
  className = "",
}: VoyageMapViewProps) {
  const handleClick = () => {
    if (isInteractive && onMapClick) {
      onMapClick();
    }
  };

  if (isLoading) {
    return (
      <View className={`relative h-64 md:h-80 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-white/10 overflow-hidden flex items-center justify-center ${className}`}><Loader2 size={32} className="animate-spin text-indigo-400" /></View>
    );
  }

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`relative h-64 md:h-80 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-white/10 overflow-hidden ${className}`} onPress={handleClick} style={{  }}>
      {/* Fond décoratif */}
      <View className="absolute inset-0 opacity-20"><View className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl" /><View className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-purple-500/20 blur-2xl" /></View>

      {/* Contenu central */}
      <View className="absolute inset-0 flex flex-col items-center justify-center text-white/40"><MapIcon size={40} className="mb-3 opacity-30" /><View className="flex items-center gap-2 text-sm font-medium"><Text className="text-white/60">{trip.from}</Text><ArrowRight size={14} className="text-indigo-400" /><Text className="text-white/60">{trip.to}</Text></View><Text className="text-xs mt-2 opacity-60">Carte interactive bientôt disponible
        </Text>{isInteractive && (
          <Pressable onPress={onMapClick} className="mt-4 px-4 py-2 rounded-xl bg-white/10 text-white/80 text-xs transition">
            Ouvrir la carte
          </Pressable>
        )}</View>

      {/* Badge "Trajet" */}
      <View className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/60 text-[10px] flex items-center gap-1">
        <MapPin size={10} />
        {trip.from} → {trip.to}
      </View>
    </View>
  );
}
