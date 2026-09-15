import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput, GestureResponderEvent } from "react-native";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  DollarSign,
  Compass,
  RotateCcw,
  ShieldCheck,
} from "lucide-react-native";

// Imports d'interfaces typées conformes à verbatimModuleSyntax
import type { RestaurantDetail } from "../types/restaurant.types";

// Imports de l'architecture d'ingénierie du module
import { useRestaurants } from "../hooks/useRestaurants";
import { useFavorites } from "../hooks/useFavorites";
import { RestaurantCard } from "../components/common/RestaurantCard";
import { CUISINES } from "../constants/cuisines";
import { RestaurationSearchEngine } from "../search";

interface RestaurationSearchPageProps {
  onBack: () => void;
  onSelectRestaurant: (id: number) => void;
}

export default function RestaurationSearchPage({
  onBack,
  onSelectRestaurant,
}: RestaurationSearchPageProps) {
  const [query, setQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("Tout");
  const [selectedPrice, setSelectedPrice] = useState<string>("all");
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [sortBy, setSortBy] = useState<"rating" | "distance" | "minOrder">(
    "rating",
  );
  const [openOnly, setOpenOnly] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const userCoordinates = { lat: 5.3484, lng: -3.9785 };

  const { restaurants, loading } = useRestaurants({
    openOnly: openOnly,
    cuisine: selectedCuisine === "Tout" ? undefined : selectedCuisine,
  });

  const { isFavorite, toggleFavorite } = useFavorites();

  // Cast de type des résultats calculés (as RestaurantDetail[]) pour corriger TS2322
  const processedResults = useMemo<RestaurantDetail[]>(() => {
    let results = [...restaurants] as RestaurantDetail[];

    if (query.trim().length > 0) {
      results = RestaurationSearchEngine.queryRestaurants(
        results,
        query,
        userCoordinates,
        25,
      ) as RestaurantDetail[];
    }

    if (selectedPrice !== "all") {
      results = results.filter((r) => r.priceRange === selectedPrice);
    }

    results = results.filter((r) => {
      if (!r.coordinates) return true;
      const distance = RestaurationSearchEngine.calculateDistance(
        userCoordinates,
        r.coordinates,
      );
      r.deliveryTime = `${Math.round(20 + distance * 4)} min`;
      return distance <= maxDistance;
    });

    results.sort((a, b) => {
      if (sortBy === "distance" && a.coordinates && b.coordinates) {
        const distA = RestaurationSearchEngine.calculateDistance(
          userCoordinates,
          a.coordinates,
        );
        const distB = RestaurationSearchEngine.calculateDistance(
          userCoordinates,
          b.coordinates,
        );
        return distA - distB;
      }
      if (sortBy === "minOrder") {
        return a.minOrder - b.minOrder;
      }
      return b.rating - a.rating;
    });

    return results;
  }, [restaurants, query, selectedPrice, maxDistance, sortBy, openOnly]);

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCuisine("Tout");
    setSelectedPrice("all");
    setMaxDistance(10);
    setSortBy("rating");
    setOpenOnly(false);
  };

  const handleToggleFavorite = async (e: GestureResponderEvent, id: number) => {
    e.stopPropagation();
    await toggleFavorite(id);
  };

  return (
    <View className="h-screen w-full flex flex-col relative text-white" style={{  }}><View className="flex-shrink-0 px-4 pt-12 pb-3 bg-slate-950/60 border-b border-white/[0.04] backdrop-blur-md flex items-center gap-3"><Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} /></Pressable><View className="flex-1 text-left"><Text className="text-lg font-black text-white leading-none">Recherche Avancée
          </Text><Text className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-bold">Filtres multicritères & Géo-tri
          </Text></View></View><View className="flex-1 flex relative overflow-hidden"><View>{showFiltersPanel && (
            <View initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 250 }} className="absolute inset-y-0 left-0 w-72 bg-[#060a22] border-r border-white/10 p-5 z-20 flex flex-col justify-between text-left shadow-2xl">
              <View className="space-y-5 overflow-y-auto no-scrollbar pb-6"><View className="flex justify-between items-center border-b border-white/5 pb-3"><Text className="text-xs font-black uppercase text-white tracking-wider">Ajuster mes critères
                  </Text><Pressable onPress={handleResetFilters} className="text-[9px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1"><RotateCcw size={10} /><Text>Reset</Text></Pressable></View><View className="space-y-2"><Text className="block text-[9px] text-white/40 uppercase font-black">Spécialité culinaire
                  </Text><Picker onValueChange={(value) => setSelectedCuisine(value)} className="w-full bg-[#020617] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none" selectedValue={selectedCuisine}><Picker.Item label="Tous les types de cuisines" value="Tout" />{CUISINES.map((c) => (
                      <Picker.Item label={c.label} value={c.label} />
                    ))}</Picker></View><View className="space-y-2"><Text className="block text-[9px] text-white/40 uppercase font-black">Gamme budgétaire
                  </Text><View className="gap-1.5">{[
                      { id: "all", label: "Toutes" },
                      { id: "$", label: "$" },
                      { id: "$$", label: "$$" },
                      { id: "$$$", label: "$$$" },
                    ].map((p) => (
                      <Pressable key={p.id} onPress={() => setSelectedPrice(p.id)} className={`py-2 rounded-lg text-xs font-black border transition-all ${
                          selectedPrice === p.id
                            ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                            : "bg-[#020617] border-white/5 text-white/40"
                        }`}>{p.label}</Pressable>
                    ))}</View></View><View className="space-y-2"><View className="flex justify-between items-center text-[9px] text-white/40 uppercase font-black"><Text>Rayon de livraison</Text><Text className="text-orange-400 font-black">{maxDistance}km
                    </Text></View><TextInput value={maxDistance} onChangeText={(value) => setMaxDistance(Number(value))} className="w-full h-1 bg-white/5 rounded-lg accent-orange-500" /></View><View className="space-y-2"><Text className="block text-[9px] text-white/40 uppercase font-black">Classer les résultats par
                  </Text><View className="space-y-1.5">{[
                      {
                        id: "rating" as const,
                        label: "Meilleures Notes",
                        icon: Star,
                        color: "text-amber-400",
                      },
                      {
                        id: "distance" as const,
                        label: "Proximité Géographique",
                        icon: Compass,
                        color: "text-sky-400",
                      },
                      {
                        id: "minOrder" as const,
                        label: "Minimum Commande Bas",
                        icon: DollarSign,
                        color: "text-emerald-400",
                      },
                    ].map((option) => {
                      const isSelected = sortBy === option.id;
                      const Icon = option.icon;
                      return (
                        <Pressable key={option.id} onPress={() => setSortBy(option.id)} className="w-full p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left" style={{ backgroundColor: isSelected
                                                      ? "rgba(255,255,255,0.03)"
                                                      : "rgba(255,255,255,0.01)", borderColor: isSelected
                                                      ? "rgba(249,115,22,0.3)"
                                                      : "rgba(255,255,255,0.04)" }}><Icon size={14} className={option.color} /><Text className={`text-xs ${isSelected ? "text-orange-400 font-extrabold" : "text-white/60 font-medium"}`}>{option.label}</Text></Pressable>
                      );
                    })}</View></View><View className="space-y-2 pt-2 border-t border-white/5"><Pressable onPress={() => setOpenOnly(!openOnly)} className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                      openOnly
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-transparent border-white/5"
                    }`}><View className="flex items-center gap-2.5"><ShieldCheck size={14} className={
                          openOnly ? "text-emerald-400" : "text-white/30"
                        } /><Text className={`text-xs ${openOnly ? "text-emerald-400 font-bold" : "text-white/60"}`}>Ouvert uniquement
                      </Text></View>{openOnly && (
                      <Text className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}</Pressable></View></View>

              <Pressable onPress={() => setShowFiltersPanel(false)} className="w-full py-3.5 rounded-xl bg-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors"><Text>Appliquer les Filtres</Text></Pressable>
            </View>
          )}</View><View className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar"><View className="flex justify-between items-center px-1 text-white/40 text-[10px] font-black uppercase tracking-wider"><Text>Résultats de recherche</Text><Text>{processedResults.length}maquis & restos</Text></View>{processedResults.length > 0 ? (
            <View className="gap-4 pb-6">
              {processedResults.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite={isFavorite(restaurant.id)}
                  onToggleFavorite={(e) =>
                    handleToggleFavorite(e, restaurant.id)
                  }
                  onSelect={onSelectRestaurant}
                />
              ))}
            </View>
          ) : (
            <View className="text-center py-20 text-white/30 text-xs flex flex-col items-center gap-2">
              <Compass size={28} className="text-white/10 animate-spin" />
              <Text className="font-bold">
                Aucun établissement ne correspond aux filtres.
              </Text>
            </View>
          )}</View></View></View>
  );
}
