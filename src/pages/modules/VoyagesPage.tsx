import { View, Pressable, Text, TextInput, Linking } from "react-native";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  ArrowLeft,
  MapPin,
  Search,
  CalendarDays,
  ArrowRight,
  Compass,
  Ticket,
} from "lucide-react-native";

// Utilisation du composant de carte dédié avec résolution d'image directe
import { VoyageTripCard } from "@/features/voyages/components/cards/VoyageTripCard";

type TransportType = "Tout" | "Bus" | "Minibus" | "Avion";

// ── Composant squelette ──────────────────────────────────
function TripCardSkeleton() {
  return (
    <View className="w-full bg-white/5 border border-white/8 rounded-2xl overflow-hidden p-4 space-y-3"><View className="flex items-center justify-between"><Skeleton className="h-6 w-14 bg-white/10" /><Skeleton className="h-4 w-20 bg-white/10" /><Skeleton className="h-6 w-14 bg-white/10" /></View><View className="flex gap-2">{Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-16 rounded-full bg-white/10" />
        ))}</View><View className="flex items-center justify-between"><Skeleton className="h-6 w-24 bg-white/10" /><Skeleton className="h-4 w-20 bg-white/10" /></View></View>
  );
}

// ── Page principale ──────────────────────────────────────

interface VoyagesPageProps {
  onBack: () => void;
  onViewTrip: (tripId: string) => void; // Remontée de l'ID pour le routing HomePage
}

export default function VoyagesPage({ onBack, onViewTrip }: VoyagesPageProps) {
  // État de recherche
  const [fromCity, setFromCity] = useState("Dakar");
  const [toCity, setToCity] = useState("Abidjan");
  const [travelDate, setTravelDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState<TransportType>("Tout");
  const [sortBy, setSortBy] = useState<"prix" | "durée" | "note">("prix");

  // Appels Convex
  const searchResults = useQuery(
    api.voyages.searchTrips,
    hasSearched ? { from: fromCity, to: toCity } : "skip",
  );
  const myBookings = useQuery(api.voyages.getMyBookings, {});

  // ─── Inspection des données de voyage de façon réactive ───
  useEffect(() => {
    if (searchResults) {
      console.log(
        "🚌 VOYAGES:",
        searchResults.map((trip) => ({
          id: trip._id,
          operator: trip.operator,
          from: trip.from,
          to: trip.to,
          imageUrl: trip.imageUrl,
        })),
      );
    }
  }, [searchResults]);

  // Seed (optionnel, pour peupler la base en dev)
  const seedTrips = useMutation(api.voyages.seedTrips);
  useEffect(() => {
    seedTrips().catch(() => {});
  }, [seedTrips]);

  const isLoading = hasSearched && searchResults === undefined;

  // Filtrage / tri local
  const filtered = useMemo(() => {
    if (!searchResults) return [];
    let list = [...searchResults];
    if (filter !== "Tout") list = list.filter((t) => t.type === filter);
    return list.sort((a, b) => {
      if (sortBy === "prix") return a.price - b.price;
      if (sortBy === "note") return b.rating - a.rating;
      return a.durationMinutes - b.durationMinutes;
    });
  }, [searchResults, filter, sortBy]);

  const doSearch = () => {
    setHasSearched(true);
  };

  const handleTripClick = (tripId: string) => {
    onViewTrip(tripId);
  };

  return (
    <View className="min-h-screen bg-[#070b14] text-white font-sans overflow-hidden relative">{}<View className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[80px] pointer-events-none" />{}<View className="sticky top-0 z-30 bg-[#070b14]/80 backdrop-blur-xl border-b border-white/5"><View className="flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={onBack} className="p-2 rounded-full bg-white/5 transition-colors"><ArrowLeft size={20} /></Pressable><View><Text className="text-lg font-bold">Voyages</Text><Text className="text-xs text-white/40">Transport inter-villes</Text></View><View className="ml-auto flex items-center gap-2"><Text className="text-2xl">✈️</Text></View></View></View><View className="px-4 pb-32 pt-4">{}<View className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6"><View className="space-y-3"><View className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"><MapPin size={16} className="text-blue-400" /><View className="flex-1"><Text className="text-xs text-white/40 mb-0.5">Départ</Text><TextInput value={fromCity} onChangeText={(value) => setFromCity(value)} className="bg-transparent text-white text-sm font-medium w-full outline-none" /></View></View><View className="flex justify-center"><Pressable onPress={() => {
                  setFromCity(toCity);
                  setToCity(fromCity);
                }} className="p-2 bg-blue-500/20 rounded-full border border-blue-500/30 transition-colors"><ArrowRight size={14} className="text-blue-400 rotate-90" /></Pressable></View><View className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"><Compass size={16} className="text-orange-400" /><View className="flex-1"><Text className="text-xs text-white/40 mb-0.5">Destination</Text><TextInput value={toCity} onChangeText={(value) => setToCity(value)} className="bg-transparent text-white text-sm font-medium w-full outline-none" /></View></View><View className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"><CalendarDays size={16} className="text-purple-400" /><View className="flex-1"><Text className="text-xs text-white/40 mb-0.5">Date de départ</Text><TextInput value={travelDate} onChangeText={(value) => setTravelDate(value)} className="bg-transparent text-white text-sm font-medium w-full outline-none [color-scheme:dark]" /></View></View></View><Pressable onPress={doSearch} className="mt-4 w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"><Search size={16} /><Text>Rechercher les trajets</Text></Pressable></View>{}{hasSearched && (
          <>
            <View className="flex items-center gap-2 text-sm text-white/60 mb-3"><Text>{isLoading ? "Recherche..." : `${filtered.length} résultats`}</Text><Text className="ml-auto text-xs">{fromCity}→ {toCity}</Text></View>

            {/* Filtres */}
            <View className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">{(["Tout", "Bus", "Minibus", "Avion"] as TransportType[]).map(
                (t) => (
                  <Pressable key={t} onPress={() => setFilter(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                      filter === t
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-white/50 hover:text-white"
                    }`}>{t === "Bus"
                      ? "🚌"
                      : t === "Minibus"
                        ? "🚐"
                        : t === "Avion"
                          ? "✈️"
                          : ""}{" "}{t}</Pressable>
                ),
              )}<View className="flex-shrink-0 flex gap-1 ml-auto">{(["prix", "durée", "note"] as const).map((s) => (
                  <Pressable key={s} onPress={() => setSortBy(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                      sortBy === s
                        ? "bg-orange-500/30 text-orange-300 border border-orange-500/40"
                        : "bg-white/5 text-white/40"
                    }`}>{s}</Pressable>
                ))}</View></View>

            {/* Liste des voyages avec VoyageTripCard */}
            <View className="space-y-4">{isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TripCardSkeleton key={i} />
                ))
              ) : filtered.length === 0 ? (
                <View className="text-center py-12"><Text className="text-white/40 text-sm">Aucun trajet trouvé pour cette route
                  </Text><Pressable onPress={() => setHasSearched(false)} className="mt-3 text-blue-400 text-sm"><Text>Modifier la recherche</Text></Pressable></View>
              ) : (
                filtered.map((trip) => (
                  <VoyageTripCard
                    key={trip._id}
                    trip={trip}
                    onPress={() => handleTripClick(trip._id)}
                  />
                ))
              )}</View>
          </>
        )}{}<Authenticated><View className="mt-6 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4"><View className="p-3 bg-indigo-500/20 rounded-xl"><Ticket size={22} className="text-indigo-400" /></View><View><Text className="text-sm font-semibold">Mes billets</Text><Text className="text-xs text-white/40">{myBookings && myBookings.length > 0
                  ? `${myBookings.length} voyage(s)`
                  : "Aucun voyage"}</Text></View><Pressable onPress={() => (Linking.openURL("/voyages/mes-billets"))} className="ml-auto px-3 py-1.5 bg-indigo-500/30 rounded-lg text-xs font-medium transition-colors">Voir
            </Pressable></View></Authenticated></View></View>
  );
}
