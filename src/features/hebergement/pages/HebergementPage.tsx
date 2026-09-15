import { View, Pressable, Text, TextInput, GestureResponderEvent } from "react-native";

// src/features/hebergement/pages/HebergementPage.tsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Filter,
  Heart,
  Bed,
  Bath,
  Square,
  Star,
  MapPin,
  X,
  Calendar,
  Phone,
  MessageCircle,
  Shield,
  ChevronRight,
  Users,
  Wifi,
  Car,
  Utensils,
  Waves,
} from "lucide-react-native";

// Hooks du module
import { useAccommodations } from "../hooks/useAccommodations";
import { useAccommodationFavorite } from "../hooks/useAccommodationFavorite";
import { useAccommodationSearch } from "../hooks/useAccommodationSearch";

// Composants
import { AccommodationCard } from "../components/card/AccommodationCard";
import { AccommodationCardSkeleton } from "../components/card/AccommodationCardSkeleton";
import { AccommodationSearch } from "../components/search/AccommodationSearch";
import { AccommodationFilters } from "../components/search/AccommodationFilters";

// Types
import type { Accommodation } from "../types/accommodation.types";

// Constantes
const ACCOMMODATION_TYPES = [
  "Tout",
  "Appartement",
  "Villa",
  "Studio",
  "Hôtel",
  "Colocation",
  "Maison",
  "Auberge",
  "Guesthouse",
  "Lodge",
  "Bungalow",
];

interface HebergementPageProps {
  onBack: () => void;
}

export default function HebergementPage({ onBack }: HebergementPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("Tout");
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Hooks
  const { accommodations, loading, error } = useAccommodations({
    type: selectedType === "Tout" ? undefined : selectedType,
    maxPrice,
  });
  const { toggleFavorite, isFavorite } = useAccommodationFavorite();
  const { searchResults, search } = useAccommodationSearch();

  // Filtrage local (recherche texte)
  const filtered = useMemo(() => {
    if (!accommodations) return [];
    let results = accommodations;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.location.city.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q),
      );
    }
    return results;
  }, [accommodations, searchQuery]);

  const handleToggleFavorite = async (id: string, e: GestureResponderEvent) => {
    e.stopPropagation();
    const added = await toggleFavorite(id);
    toast.success(added ? "Ajouté aux favoris" : "Retiré des favoris");
  };

  const handleSelect = (id: string) => {
    navigate(`/hebergement/${id}`);
  };

  if (loading) {
    return (
      <View className="h-full flex flex-col bg-[#020617]"><View className="flex-shrink-0 px-4 pt-12 pb-3"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5"><ArrowLeft size={20} className="text-white" /></Pressable><View><Text className="text-xl font-bold text-white">Hébergement</Text><Text className="text-xs text-white/50">Chargement...</Text></View></View></View><View className="flex-1 overflow-y-auto px-4 pb-6"><View className="gap-4">{Array.from({ length: 4 }).map((_, i) => (
              <AccommodationCardSkeleton key={i} />
            ))}</View></View></View>
    );
  }

  if (error) {
    return (
      <View className="h-full flex flex-col items-center justify-center bg-[#020617]"><Text className="text-white/60 text-sm">{error}</Text><Pressable onPress={onBack} className="mt-4 px-6 py-2 rounded-xl bg-indigo-500 text-white"><Text>Retour</Text></Pressable></View>
    );
  }

  return (
    <View className="h-full flex flex-col" style={{  }}>{}<View className="flex-shrink-0 px-4 pt-12 pb-3"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={20} className="text-white" /></Pressable><View className="flex-1"><Text className="text-xl font-bold text-white">Hébergement</Text><Text className="text-xs text-white/50">{filtered.length}logements disponibles
            </Text></View><Pressable onPress={() => setShowFilters(!showFilters)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: showFilters
                            ? "rgba(99,102,241,0.3)"
                            : "rgba(255,255,255,0.08)" }}><Filter size={18} className="text-white" /></Pressable></View>{}<View className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Search size={16} className="text-white/40" /><TextInput value={searchQuery} onChangeText={(value) => setSearchQuery(value)} placeholder="Ville, quartier, type..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" /></View>{}<View>{showFilters && (
            <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
              <View className="py-3 px-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-white/60 text-xs mb-2">Budget max: {(maxPrice / 1000).toFixed(0)}k FCFA
                </Text><TextInput value={maxPrice} onChangeText={(value) => setMaxPrice(Number(value))} className="w-full accent-indigo-500" /></View>
            </View>
          )}</View>{}<View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">{ACCOMMODATION_TYPES.map((type) => (
            <Pressable key={type} onPress={() => setSelectedType(type)} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: selectedType === type
                                ? "rgba(99,102,241,0.5)"
                                : "rgba(255,255,255,0.07)", borderColor: "rgba(99,102,241,0.6)", borderStyle: "solid" }}>{type}</Pressable>
          ))}</View></View>{}<View className="flex-1 overflow-y-auto px-4 pb-6"><View className="gap-4">{filtered.map((accommodation) => (
            <AccommodationCard
              key={accommodation.id}
              accommodation={accommodation}
              isFavorite={isFavorite(accommodation.id)}
              onToggleFavorite={(e) =>
                handleToggleFavorite(accommodation.id, e)
              }
              onSelect={() => handleSelect(accommodation.id)}
            />
          ))}{filtered.length === 0 && (
            <View className="flex flex-col items-center justify-center py-20 text-center">
              <Home size={48} className="text-white/10" />
              <Text className="text-white/40 text-sm mt-4">
                Aucun logement trouvé
              </Text>
              <Text className="text-white/20 text-xs mt-1">
                Essayez de modifier vos filtres
              </Text>
            </View>
          )}</View></View></View>
  );
}

// Icône de fallback pour Home
const Home = ({ size, className }: { size: number; className?: string }) => (
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
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
