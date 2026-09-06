import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput, GestureResponderEvent } from "react-native";

// src/features/restauration/pages/RestaurationPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  ArrowLeft,
  Search,
  MapPin,
  Sparkles,
  Tag,
  LayoutDashboard,
  ChevronRight,
  Utensils,
  Compass,
  Bell,
  ShoppingBag,
  Heart,
  Flame,
  Leaf,
  Coffee,
  Pizza,
  ChefHat,
} from "lucide-react-native";

// Imports de l'architecture d'ingénierie du module
import { useRestaurants } from "../hooks/useRestaurants";
import { useFavorites } from "../hooks/useFavorites";
import { RestaurantCard } from "../components/common/RestaurantCard";
import { CUISINES } from "../constants/cuisines";
import { PAYMENT_METHODS } from "../constants/paymentMethods";

// Imports des sous-pages de routage interne du module
// ✅ On n'importe plus RestaurationDetailPage ici, on navigue vers la route
import RestaurationDashboardPage from "./RestaurationDashboardPage";

interface RestaurationPageProps {
  onBack: () => void;
}

const CUISINE_ICONS: Record<string, any> = {
  "Africaine Traditionnelle": Leaf,
  "Fusion Afro-Gastronomique": ChefHat,
  "Pizzas Artisanales": Pizza,
  "Café & Snack": Coffee,
  "Grillades & Maquis": Flame,
  Tout: Utensils,
};

export default function RestaurationPage({ onBack }: RestaurationPageProps) {
  const router = useRouter(); // ✅ pour naviguer vers la page détail

  // Navigation et routage d'état interne
  const [activeView, setActiveTab] = useState<"home" | "dashboard">("home"); // ✅ on retire "detail"
  // ✅ on supprime selectedRestaurantId

  // Filtres actifs
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("Tout");
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);

  // Intégration des hooks réactifs d'approvisionnement
  const {
    restaurants,
    loading: loadingRestaurants,
    updateFilters,
  } = useRestaurants({
    openOnly: showOnlyOpen,
    cuisine: selectedCuisine === "Tout" ? undefined : selectedCuisine,
  });

  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Filtrage local complémentaire pour la saisie clavier instantanée
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.speciality.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [restaurants, searchQuery]);

  // Promotions d'en-tête
  const activePromotions = [
    {
      code: "MAMA225",
      text: "-15% sur les grillades",
      bg: "from-orange-500/20 to-amber-500/10",
    },
    {
      code: "FREECOCODY",
      text: "Livraison offerte à Cocody",
      bg: "from-emerald-500/20 to-teal-500/10",
    },
  ];

  const handleToggleFavorite = async (e: GestureResponderEvent, id: number) => {
    const isAdded = await toggleFavorite(id);
    if (isAdded) {
      UIService.openToast("Établissement ajouté à vos favoris", "success");
    } else {
      UIService.openToast("Retiré de vos favoris", "success");
    }
  };

  // ✅ On utilise navigate pour aller sur la page détail
  const handleSelectRestaurant = (id: number) => {
    router.push(`/restauration/${id}`);
  };

  return (
    <View
      className="h-screen w-full flex flex-col relative text-white overflow-hidden"
      style={{  }}
    >
      <>
        {/* VUE 1 : ACCUEIL DU MODULE (HUB) */}
        {activeView === "home" && (
          <View
            key="home"
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* EN-TÊTE DU MODULE */}
            <View className="flex-shrink-0 px-4 pt-12 pb-3">
              <View className="flex items-center justify-between mb-4">
                <View className="flex items-center gap-3">
                  <Pressable
                    onPress={onBack}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                  >
                    <ArrowLeft size={18} />
                  </Pressable>
                  <View>
                    <Text className="text-lg font-black text-white flex items-center gap-1.5 leading-none">
                      Restauration{" "}
                      <Sparkles
                        size={14}
                        className="text-orange-400 animate-pulse"
                      />
                    </Text>
                    <View className="flex items-center gap-1 mt-1 text-[10px] text-white/40">
                      <MapPin size={10} className="text-orange-400" />
                      <Text>Cocody, Abidjan</Text>
                    </View>
                  </View>
                </View>

                <View className="flex gap-2">
                  <Pressable
                    onPress={() => setActiveTab("dashboard")}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-orange-400"
                    style={{ backgroundColor: "rgba(249,115,22,0.08)", borderWidth: 1, borderColor: "rgba(249,115,22,0.15)", borderStyle: "solid" }}
                   
                  >
                    <LayoutDashboard size={18} />
                  </Pressable>
                  <Pressable
                    onPress={() => UIService.openToast("Aucune nouvelle notification", "info")}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                  >
                    <Bell size={18} />
                  </Pressable>
                </View>
              </View>

              {/* BARRE DE RECHERCHE INTELLIGENTE */}
              <View
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl mb-4"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                <Search size={15} className="text-white/40 shrink-0" />
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)}
                  placeholder="Rechercher un maquis, plat, spécialité..."
                  className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                />
              </View>

              {/* HORIZONTAL CAROUSEL DES CUISINES */}
              <View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Pressable
                  onPress={() => setSelectedCuisine("Tout")}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                  style={{ backgroundColor: selectedCuisine === "Tout"
                                          ? "rgba(249,115,22,0.2)"
                                          : "rgba(255,255,255,0.03)", borderColor:
                                        selectedCuisine === "Tout"
                                          ? "rgba(249,115,22,0.3)"
                                          : "transparent" }}
                >
                  <Utensils size={13} /> <Text>Tout</Text></Pressable>
                {CUISINES.map((c) => {
                  const Icon = CUISINE_ICONS[c.label] || Utensils;
                  const isSelected = selectedCuisine === c.label;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedCuisine(c.label)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                      style={{ backgroundColor: isSelected
                                                ? "rgba(249,115,22,0.2)"
                                                : "rgba(255,255,255,0.03)", borderColor: isSelected
                                                ? "rgba(249,115,22,0.3)"
                                                : "transparent" }}
                    >
                      <Icon size={13} /> {c.label}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* CONTENU DEFILANT PRINCIPAL */}
            <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
              {/* SECTION PROMOTIONS EN COURS */}
              <View className="space-y-2.5">
                <View className="flex items-center gap-1.5 px-1 text-white/40">
                  <Tag size={13} />
                  <Text className="text-[10px] font-black uppercase tracking-wider">
                    Offres & Réductions exclusives
                  </Text>
                </View>
                <View className="flex gap-3 overflow-x-auto no-scrollbar">
                  {activePromotions.map((promo) => (
                    <View
                      key={promo.code}
                      className={`p-3.5 rounded-2xl bg-gradient-to-tr border border-orange-500/15 flex flex-col gap-2 min-w-[240px] text-left ${promo.bg}`}
                    >
                      <Text className="text-[9px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded w-fit">
                        {promo.code}
                      </Text>
                      <Text className="text-xs font-black text-white/90 leading-tight">
                        {promo.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* LISTE DE RENDU DES RESTAURANTS */}
              <View className="space-y-3">
                <View className="flex justify-between items-center px-1 text-white/40">
                  <Text className="text-[10px] font-black uppercase tracking-wider">
                    {filteredRestaurants.length} <Text>établissements trouvés</Text></Text>
                  <Pressable
                    onPress={() => setShowOnlyOpen(!showOnlyOpen)}
                    className={`text-[9px] font-black uppercase tracking-wider border px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                      showOnlyOpen
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-white/10 text-white/50"
                    }`}
                  >
                    <Text>Ouverts uniquement</Text></Pressable>
                </View>

                {loadingRestaurants ? (
                  <View className="text-center py-12 text-white/30 text-xs">
                    <Text>Chargement du catalogue DébrouillePro...</Text></View>
                ) : filteredRestaurants.length > 0 ? (
                  <View className="gap-4">
                    {filteredRestaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        isFavorite={isFavorite(restaurant.id)}
                        onToggleFavorite={(e) =>
                          handleToggleFavorite(e, restaurant.id)
                        }
                        onSelect={handleSelectRestaurant}
                      />
                    ))}
                  </View>
                ) : (
                  <View className="text-center py-12 text-white/30 text-xs flex flex-col items-center gap-2">
                    <Compass size={24} className="text-white/20 animate-spin" />
                    <Text>
                      <Text>Aucun restaurant ne correspond à vos filtres de recherche.</Text></Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* VUE 2 : CONSOLE PROFESSIONNELLE RESTAURATEUR */}
        {activeView === "dashboard" && (
          <View
            key="dashboard"
            className="flex-1 h-full overflow-hidden"
          >
            <RestaurationDashboardPage onBack={() => setActiveTab("home")} />
          </View>
        )}
      </>
    </View>
  );
}
