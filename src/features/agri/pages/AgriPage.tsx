import { Pressable, View, Text, GestureResponderEvent } from "react-native";

// src/features/agri/pages/AgriPage.tsx
import { useState, useCallback, useMemo } from "react";
import { ArrowLeft, Plus, Grid, List } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

// Importations unifiées via le registre d'index des composants de la feature
import {
  AgriGrid,
  AgriList,
  AgriSearch,
  AgriCategoryFilter,
  AgriFilters,
  AgriSort,
} from "../components";

import { CreateAgriSheet } from "../sheets/CreateAgriSheet";
import { FilterAgriSheet } from "../sheets/FilterAgriSheet";
import type { AgriCategory, AgriProduct } from "../types/product.types";

interface AgriPageProps {
  onBack: () => void;
  onSelectProduct?: (id: string) => void; // ✅ Rendu optionnel pour la compatibilité avec App.tsx et page.tsx
}

export default function AgriPage({ onBack, onSelectProduct }: AgriPageProps) {
  // États de recherche, tri et filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AgriCategory | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({
    min: "",
    max: "",
    currency: "USD",
  });
  const [selectedStatus, setSelectedStatus] = useState<
    ("available" | "limited" | "pre_order")[]
  >([]);
  const [sortOption, setSortOption] = useState("recent");

  // États d'affichage
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

  // État local des favoris (peut être connecté à un hook global)
  const [favorites, setFavorites] = useState<string[]>([]);

  // Requête vers le backend Convex
  const rawProducts = useQuery(api.agri?.listProducts, {
    category: selectedCategory || undefined,
    location: selectedLocation || undefined,
    sort: sortOption,
  });

  const isLoading = rawProducts === undefined;

  // Calcul du nombre de filtres actifs pour le badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedLocation) count++;
    if (priceRange.min || priceRange.max) count++;
    if (selectedStatus.length > 0) count++;
    return count;
  }, [selectedLocation, priceRange, selectedStatus]);

  // Filtrage local complémentaire pour la recherche textuelle
  const filteredProducts = useMemo(() => {
    if (!rawProducts) return [];
    const products = rawProducts as unknown as AgriProduct[];
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.variety?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q),
    );
  }, [rawProducts, searchQuery]);

  const handleToggleFavorite = useCallback(
    (id: string, e: GestureResponderEvent) => {
      e.stopPropagation();
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setSelectedLocation(null);
    setPriceRange({ min: "", max: "", currency: "USD" });
    setSelectedStatus([]);
  }, []);

  return (
    <View className="h-full w-full flex flex-col overflow-hidden" style={{  }}>{}<View className="px-5 pt-12 pb-3 flex items-center justify-between border-b border-white/5 bg-black/10 backdrop-blur-md"><View className="flex items-center gap-3"><Pressable whileTap={{ scale: 0.92 }} onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/5 transition-colors"><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-white font-black text-base flex items-center gap-2">Marché Agricole <Text className="text-xl">🌱</Text></Text><Text className="text-white/40 text-[10px] tracking-wide">Produits locaux, intrants & conseils d'agronomes
            </Text></View></View><Pressable whileTap={{ scale: 0.95 }} onPress={() => setIsCreateSheetOpen(true)} className="flex items-center gap-1.5 px-3.5 h-10 rounded-2xl text-xs font-bold bg-green-500 text-black border border-green-400/20 shadow-lg shadow-green-500/10 transition-colors"><Plus size={15} strokeWidth={2.5} /><Text>Vendre</Text></Pressable></View>{}<View className="p-4 space-y-3 bg-black/5 border-b border-white/5 flex-shrink-0"><View className="flex items-center gap-2"><View className="flex-1"><AgriSearch value={searchQuery} onChange={setSearchQuery} /></View>{}<View className="flex items-center p-0.5 rounded-xl bg-white/[0.03] border border-white/5"><Pressable onPress={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-white/[0.05] text-green-400"
                  : "text-white/40 hover:text-white/70"
              }`}><Grid size={13} /></Pressable><Pressable onPress={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-white/[0.05] text-green-400"
                  : "text-white/40 hover:text-white/70"
              }`}><List size={13} /></Pressable></View></View>{}<AgriCategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />{}<View className="flex items-center justify-between gap-4 pt-1.5 border-t border-white/5"><AgriFilters activeFiltersCount={activeFiltersCount} onOpenFilters={() => setIsFilterSheetOpen(true)} onClearAll={handleClearFilters} /><AgriSort value={sortOption} onChange={setSortOption} /></View></View>{}<View className="flex-1 overflow-y-auto px-5 py-4"><View>{viewMode === "grid" ? (
            <View key="grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AgriGrid
                products={filteredProducts}
                isLoading={isLoading}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectProduct={onSelectProduct}
              />
            </View>
          ) : (
            <View key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <AgriList
                products={filteredProducts}
                isLoading={isLoading}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectProduct={onSelectProduct}
              />
            </View>
          )}</View></View>{}<FilterAgriSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} selectedLocation={selectedLocation} onSelectLocation={setSelectedLocation} priceRange={priceRange} onChangePrice={setPriceRange} selectedStatus={selectedStatus} onChangeStatus={setSelectedStatus} /><CreateAgriSheet isOpen={isCreateSheetOpen} onClose={() => setIsCreateSheetOpen(false)} /></View>
  );
}
