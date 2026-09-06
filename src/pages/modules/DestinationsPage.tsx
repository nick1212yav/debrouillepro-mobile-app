import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text, Image, TextInput, GestureResponderEvent } from "react-native";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d";
import { Authenticated } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Search, Heart, Star, MapPin, Filter,
  X, Globe, Plane, Thermometer, DollarSign, Users,
  Bookmark, ChevronRight, Sparkles, TrendingUp, Clock,
  Mountain, Waves, Building2, TreePine, Camera,
} from "lucide-react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type Continent = "Tous" | "Europe" | "Asie" | "Amériques" | "Afrique" | "Océanie";
type Budget = "Tous" | "Économique" | "Moyen" | "Premium" | "Luxe";

const CONTINENTS: Continent[] = ["Tous", "Europe", "Asie", "Amériques", "Afrique", "Océanie"];
const BUDGETS: Budget[] = ["Tous", "Économique", "Moyen", "Premium", "Luxe"];

const BUDGET_COLORS: Record<string, string> = {
  Tous: "#8B5CF6", "Économique": "#10B981", Éco: "#10B981", Moyen: "#3B82F6", Premium: "#F97316", Luxe: "#EC4899",
};

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function DestCardSkeleton() {
  return (
    <View className="w-full rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <Skeleton className="h-48 w-full bg-white/10" />
      <View className="px-3 py-2.5 flex items-center gap-1.5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
        <Skeleton className="h-4 w-12 rounded-full bg-white/10" />
        <Skeleton className="h-4 w-16 rounded-full bg-white/10" />
      </View>
    </View>
  );
}

// ─── Detail Modal ────────────────────────────────────────────────────────────

function DestinationModal({ dest, isSaved, onToggleSave, onClose }: {
  dest: Doc<"destinations">; isSaved: boolean; onToggleSave: () => void; onClose: () => void;
}) {
  const destColor = dest.color || "#6366F1";
  return (
    <View
      className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: "rgba(0,0,0,0.9)" }}>
      <View
        className="flex flex-col h-full overflow-y-auto">

        {/* Hero image */}
        <View className="relative h-72 flex-shrink-0">
          {dest.imageUrl && <Image className="w-full h-full object-cover"  source={{ uri: dest.imageUrl }} accessibilityLabel={dest.name}/>}
          {!dest.imageUrl && <View className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50" />}
          <View className="absolute inset-0" style={{  }} />
          <Pressable onPress={onClose}
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderStyle: "solid" }}>
            <X size={18} className="text-white" />
          </Pressable>
          <Authenticated>
            <Pressable onPress={onToggleSave}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isSaved ? "rgba(239,68,68,0.8)" : "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderStyle: "solid" }}>
              <Heart size={18} className="text-white" fill={isSaved ? "white" : "none"} />
            </Pressable>
          </Authenticated>
          <View className="absolute bottom-4 left-4">
            <Text className="text-3xl font-black text-white">{dest.name}</Text>
            <View className="flex items-center gap-2 mt-1">
              <MapPin size={13} className="text-white/70" />
              <Text className="text-white/70 text-sm">{dest.country}</Text>
              <Text className="text-white/40">·</Text>
              <Text className="text-sm px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${destColor}30`, color: destColor }}>{dest.continent}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View className="flex-1 px-4 py-5 space-y-5">
          {/* Quick stats */}
          <View className="gap-2">
            {[
              { icon: Star, label: `${dest.rating}`, sub: `${(dest.reviewCount / 1000).toFixed(1)}k avis`, color: "#F59E0B" },
              { icon: DollarSign, label: dest.budget, sub: "Budget", color: BUDGET_COLORS[dest.budget] || "#3B82F6" },
              { icon: Clock, label: `${dest.flightHours}h`, sub: "Vol", color: "#3B82F6" },
              { icon: Globe, label: dest.language, sub: "Langue", color: "#8B5CF6" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <View key={s.label + s.sub} className="rounded-xl p-3 flex flex-col items-center gap-1"
                  style={{ backgroundColor: `${s.color}12`, borderStyle: "solid" }}>
                  <Icon size={16} style={{ color: s.color }} />
                  <Text className="text-white text-xs font-bold text-center leading-tight">{s.label}</Text>
                  <Text className="text-white/40 text-[10px]">{s.sub}</Text>
                </View>
              );
            })}
          </View>

          {/* Description */}
          <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            <Text className="text-white/80 text-sm leading-relaxed">{dest.description}</Text>
          </View>

          {/* Highlights */}
          {dest.highlights.length > 0 && (
            <View>
              <Text className="text-white font-semibold mb-3 text-sm">Incontournables</Text>
              <View className="gap-2">
                {dest.highlights.map((h, i) => (
                  <View key={i} className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ backgroundColor: `${destColor}12`, borderStyle: "solid" }}>
                    <View className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: destColor }} />
                    <Text className="text-white/80 text-sm">{h}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Infos pratiques */}
          <View>
            <Text className="text-white font-semibold mb-3 text-sm">Infos pratiques</Text>
            <View className="space-y-2">
              {[
                { label: "Langue", value: dest.language, icon: Globe },
                { label: "Devise", value: dest.currency, icon: DollarSign },
                { label: "Budget", value: dest.budget, icon: Thermometer },
                { label: "Vol depuis Afrique", value: `~${dest.flightHours}h`, icon: Plane },
              ].map(info => {
                const Icon = info.icon;
                return (
                  <View key={info.label} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                    <Icon size={14} className="text-white/40 flex-shrink-0" />
                    <Text className="text-white/50 text-sm flex-shrink-0 w-28">{info.label}</Text>
                    <Text className="text-white/80 text-sm">{info.value}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Community reviews */}
          <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            <View className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-white/50" />
              <Text className="text-white/70 text-sm font-medium">Avis de la communauté</Text>
            </View>
            <View className="flex items-center gap-3">
              <Text className="text-4xl font-black text-white">{dest.rating}</Text>
              <View>
                <View className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} className={s <= Math.floor(dest.rating) ? "text-yellow-400" : "text-white/20"} fill={s <= Math.floor(dest.rating) ? "currentColor" : "none"} />
                  ))}
                </View>
                <Text className="text-white/40 text-xs">{dest.reviewCount.toLocaleString()} avis</Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <Authenticated>
            <Pressable onPress={onToggleSave}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={isSaved
                ? { backgroundColor: "rgba(239,68,68,0.2)", borderWidth: 1, borderColor: "rgba(239,68,68,0.4)", borderStyle: "solid" }
                : {  }}>
              <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
              {isSaved ? "Retirer de la bucket list" : "Ajouter à ma bucket list"}
            </Pressable>
          </Authenticated>
        </View>
      </View>
    </View>
  );
}

// ─── Destination Card ─────────────────────────────────────────────────────────

function DestCard({ dest, isSaved, onToggleSave, onClick }: {
  dest: Doc<"destinations">; isSaved: boolean; onToggleSave: (e: GestureResponderEvent) => void; onClick: () => void;
}) {
  const destColor = dest.color || "#6366F1";
  return (
    <Pressable onPress={onClick}
      className="w-full text-left rounded-2xl overflow-hidden relative"
      style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      {/* Image */}
      <View className="relative h-48">
        {dest.imageUrl && <Image className="w-full h-full object-cover"  source={{ uri: dest.imageUrl }} accessibilityLabel={dest.name}/>}
        {!dest.imageUrl && <View className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40" />}
        <View className="absolute inset-0" style={{  }} />

        {/* Badges top */}
        <View className="absolute top-3 left-3 flex gap-1.5">
          {dest.trending && (
            <Text className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: "rgba(249,115,22,0.9)", color: "white" }}>
              <TrendingUp size={9} /> Tendance
            </Text>
          )}
          <Text className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${BUDGET_COLORS[dest.budget] || "#3B82F6"}cc`, color: "white" }}>
            {dest.budget}
          </Text>
        </View>

        {/* Bucket list heart */}
        <Authenticated>
          <Pressable onPress={onToggleSave}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}>
            <Heart size={14} className={isSaved ? "text-red-400" : "text-white"} fill={isSaved ? "currentColor" : "none"} />
          </Pressable>
        </Authenticated>

        {/* Bottom info */}
        <View className="absolute bottom-0 left-0 right-0 p-3">
          <View className="flex items-end justify-between">
            <View>
              <Text className="text-white font-bold text-base leading-tight">{dest.name}</Text>
              <View className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-white/60" />
                <Text className="text-white/60 text-xs">{dest.country}</Text>
              </View>
            </View>
            <View className="text-right">
              <View className="flex items-center gap-1 justify-end">
                <Star size={11} className="text-yellow-400" fill="currentColor" />
                <Text className="text-white text-sm font-bold">{dest.rating}</Text>
              </View>
              <View className="flex items-center gap-1 mt-0.5">
                <Sparkles size={9} style={{ color: destColor }} />
                <Text className="text-xs font-semibold" style={{ color: destColor }}>{dest.flightHours}h</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tags */}
      <View className="px-3 py-2.5 flex items-center gap-1.5 flex-wrap"
        style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
        <Text className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
          <Globe size={9} /> {dest.continent}
        </Text>
        <Text className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
          <DollarSign size={9} /> {dest.budget}
        </Text>
        <Text className="text-[10px] text-white/30 ml-auto flex items-center gap-1">
          <Clock size={9} /> {dest.flightHours}h vol
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DestinationsPage({ onBack }: { onBack: () => void }) {
  const [searchText, setSearchText] = useState("");
  const [continent, setContinent] = useState<Continent>("Tous");
  const [budget, setBudget] = useState<Budget>("Tous");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Doc<"destinations"> | null>(null);
  const [tab, setTab] = useState<"discover" | "bucket">("discover");

  // Seed on mount
  const seedTrips = useMutation(api.voyages.seedTrips);
  useEffect(() => {
    seedTrips().catch(() => { /* already seeded */ });
  }, [seedTrips]);

  // Load destinations from Convex
  const destinations = useQuery(api.voyages.listDestinations, {});
  const savedDestinations = useQuery(api.voyages.getMySavedDestinations, {});
  const toggleSave = useMutation(api.voyages.toggleSaveDestination);

  const isLoading = destinations === undefined;
  const savedIds = useMemo(() => {
    if (!savedDestinations) return new Set<string>();
    return new Set(savedDestinations.filter(Boolean).map(d => d!._id));
  }, [savedDestinations]);

  const handleToggleSave = async (destId: Doc<"destinations">["_id"]) => {
    try {
      await toggleSave({ destinationId: destId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur";
      UIService.openToast(message, "error");
    }
  };

  // Filter destinations locally
  const filtered = useMemo(() => {
    if (!destinations) return [];
    let list = [...destinations];
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q));
    }
    if (continent !== "Tous") list = list.filter(d => d.continent === continent);
    if (budget !== "Tous") list = list.filter(d => d.budget === budget);
    if (tab === "bucket") list = list.filter(d => savedIds.has(d._id));
    return list.sort((a, b) => b.rating - a.rating);
  }, [destinations, searchText, continent, budget, tab, savedIds]);

  const activeFilters = [continent !== "Tous", budget !== "Tous"].filter(Boolean).length;

  return (
    <View className="h-full flex flex-col" style={{  }}>

      {/* Header */}
      <View className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">Destinations</Text>
          <Text className="text-xs text-white/50">Découvrez votre prochain voyage</Text>
        </View>
        <View className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ backgroundColor: "rgba(99,102,241,0.15)", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}>
          <Globe size={13} className="text-indigo-400" />
          <Text className="text-xs font-semibold text-indigo-300">{destinations?.length ?? "..."} dest.</Text>
        </View>
      </View>

      {/* Search + Filter */}
      <View className="px-4 py-2 flex gap-2">
        <View className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <TextInput value={searchText} onChangeText={text => setSearchText(text)} placeholder="Paris, Japon, plage..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none"
            style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />
        </View>
        <Pressable onPress={() => setShowFilters(p => !p)}
          className="relative w-11 h-11 rounded-xl flex items-center justify-center"
          style={showFilters || activeFilters > 0
            ? {  }
            : { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
          <Filter size={16} className="text-white" />
          {activeFilters > 0 && (
            <Text className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white"
              style={{ backgroundColor: "#EF4444" }}>{activeFilters}</Text>
          )}
        </Pressable>
      </View>

      {/* Filters panel */}
      <>
        {showFilters && (
          <View
            className="overflow-hidden px-4 pb-2 space-y-3">
            <View>
              <Text className="text-white/50 text-xs mb-1.5">Continent</Text>
              <View className="flex gap-1.5 flex-wrap">
                {CONTINENTS.map(opt => (
                  <Pressable key={opt} onPress={() => setContinent(opt)}
                    className="px-3 py-1 rounded-lg text-xs font-medium"
                    style={continent === opt
                      ? {  }
                      : { backgroundColor: "rgba(255,255,255,0.06)" }}>
                    {opt}
                  </Pressable>
                ))}
              </View>
            </View>
            <View>
              <Text className="text-white/50 text-xs mb-1.5">Budget</Text>
              <View className="flex gap-1.5 flex-wrap">
                {BUDGETS.map(opt => (
                  <Pressable key={opt} onPress={() => setBudget(opt)}
                    className="px-3 py-1 rounded-lg text-xs font-medium"
                    style={budget === opt
                      ? {  }
                      : { backgroundColor: "rgba(255,255,255,0.06)" }}>
                    {opt}
                  </Pressable>
                ))}
              </View>
            </View>
            {activeFilters > 0 && (
              <Pressable onPress={() => { setContinent("Tous"); setBudget("Tous"); }}
                className="flex items-center gap-1.5 text-xs text-red-400">
                <X size={12} /> <Text>Réinitialiser les filtres</Text></Pressable>
            )}
          </View>
        )}
      </>

      {/* Continent scroll pills */}
      <View className="px-4 pb-2 overflow-x-auto">
        <View className="flex gap-2">
          {CONTINENTS.map(c => (
            <Pressable key={c} onPress={() => setContinent(c)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium"
              style={continent === c
                ? {  }
                : { backgroundColor: "rgba(255,255,255,0.06)" }}>
              {c}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View className="px-4 pb-3 flex gap-2">
        {[
          { id: "discover" as const, label: "Découvrir", icon: Globe },
          { id: "bucket" as const, label: `Bucket List (${savedIds.size})`, icon: Bookmark },
        ].map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Pressable key={t.id} onPress={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
              style={active
                ? {  }
                : { backgroundColor: "rgba(255,255,255,0.06)" }}>
              <Icon size={13} />
              {t.label}
            </Pressable>
          );
        })}
      </View>

      {/* Cards list */}
      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {/* Match score hero banner */}
        {tab === "discover" && !searchText && continent === "Tous" && (
          <View
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{ borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}>
            <View className="absolute -right-6 -top-6 w-28 h-28 rounded-full"
              style={{  }} />
            <View className="flex items-center gap-3">
              <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{  }}>
                <Sparkles size={18} className="text-white" />
              </View>
              <View>
                <Text className="text-white font-bold text-sm">Destinations populaires</Text>
                <Text className="text-white/50 text-xs">Classées par note communautaire</Text>
              </View>
            </View>
          </View>
        )}

        {isLoading ? (
          <View className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <DestCardSkeleton key={i} />)}
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16 gap-3">
            <View className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              {tab === "bucket" ? <Bookmark size={24} className="text-white/30" /> : <Globe size={24} className="text-white/30" />}
            </View>
            <Text className="text-white/50 text-sm text-center">
              {tab === "bucket" ? "Votre bucket list est vide.\nAjoutez des destinations !" : "Aucune destination trouvée"}
            </Text>
            {tab === "bucket" && (
              <Pressable onPress={() => setTab("discover")} className="flex items-center gap-1.5 text-indigo-400 text-sm">
                <ChevronRight size={14} /> <Text>Explorer les destinations</Text></Pressable>
            )}
          </View>
        ) : (
          filtered.map((dest, i) => (
            <View key={dest._id}>
              <DestCard
                dest={dest}
                isSaved={savedIds.has(dest._id)}
                onToggleSave={e => { handleToggleSave(dest._id); }}
                onPress={() => setSelected(dest)}
              />
            </View>
          ))
        )}
      </View>

      {/* Detail modal */}
      <>
        {selected && (
          <DestinationModal
            dest={selected}
            isSaved={savedIds.has(selected._id)}
            onToggleSave={() => handleToggleSave(selected._id)}
            onClose={() => setSelected(null)}
          />
        )}
      </>
    </View>
  );
}
