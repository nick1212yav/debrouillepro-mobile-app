import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Search, SlidersHorizontal, Heart, MapPin, Bed,
  Bath, Maximize2, Phone, MessageCircle, Star, X, Home,
  Users, TrendingUp, Calculator, ChevronDown, ChevronUp,
  Bookmark, CheckCircle, Calendar, Eye, Share2, Bell
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";
type TabId = "location" | "achat" | "colocation";
type ListingType = "location" | "achat" | "colocation";

interface Listing {
  id: string; type: ListingType; tag: string; tagColor: string;
  price: string; priceColor: string; title: string; address: string;
  beds: number; baths: number; sqm: number; floor?: string; img: string;
  rating: number; reviews: number; views: string; available: string;
  features: string[]; landlord: string; landlordAvatar: string; verified: boolean;
  colocataires?: number; colocatairesMax?: number;
}

const LISTINGS: Listing[] = [
  { id: "log-1", type: "location", tag: "À louer", tagColor: "#F97316", price: "$450/mois", priceColor: "#10B981", title: "Maison 3 ch. · Joli Site", address: "Kolwezi, Q. Joli Site", beds: 3, baths: 2, sqm: 120, img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80", rating: 4.7, reviews: 24, views: "2.3K", available: "Dès maintenant", features: ["Eau courante", "Électricité", "Sécurité 24h", "Parking"], landlord: "M. Mutombo", landlordAvatar: "MT", verified: true },
  { id: "log-2", type: "location", tag: "À louer", tagColor: "#F97316", price: "$200/mois", priceColor: "#10B981", title: "Studio meublé · Centre-ville", address: "Goma, Avenue Kiwu", beds: 1, baths: 1, sqm: 42, img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80", rating: 4.4, reviews: 11, views: "1.1K", available: "01 Août 2025", features: ["Meublé", "WiFi", "Eau chaude", "1er étage"], landlord: "Mme. Kavira", landlordAvatar: "KV", verified: true },
  { id: "log-3", type: "achat", tag: "À vendre", tagColor: "#8B5CF6", price: "$18 500", priceColor: "#8B5CF6", title: "Villa moderne · Commune Kenya", address: "Lubumbashi, Commune Kenya", beds: 4, baths: 3, sqm: 210, img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80", rating: 4.9, reviews: 8, views: "850", available: "Dès maintenant", features: ["Jardin", "Garage 2 voitures", "Piscine", "Clôture haute"], landlord: "Agence Immo Pro", landlordAvatar: "AI", verified: true },
  { id: "log-4", type: "achat", tag: "À vendre", tagColor: "#8B5CF6", price: "$7 200", priceColor: "#8B5CF6", title: "Appartement F3 · Matonge", address: "Kinshasa, Matonge", beds: 2, baths: 1, sqm: 75, floor: "3ème étage", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80", rating: 4.2, reviews: 5, views: "520", available: "Dès maintenant", features: ["Balcon", "Résidence sécurisée", "Ascenseur", "Cuisine équipée"], landlord: "M. Diallo", landlordAvatar: "DI", verified: false },
  { id: "log-5", type: "colocation", tag: "Colocation", tagColor: "#3B82F6", price: "$120/mois", priceColor: "#3B82F6", title: "Grande villa partagée · Lubumbashi", address: "Lubumbashi, Annexe", beds: 1, baths: 2, sqm: 25, img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80", rating: 4.6, reviews: 17, views: "3.2K", available: "Dès maintenant", features: ["Chambre meublée", "Cuisine commune", "WiFi", "Ménage hebdo"], landlord: "Résidence Jeunes", landlordAvatar: "RJ", verified: true, colocataires: 3, colocatairesMax: 5 },
  { id: "log-6", type: "colocation", tag: "Colocation", tagColor: "#3B82F6", price: "$90/mois", priceColor: "#3B82F6", title: "Appart. partagé étudiants · Goma", address: "Goma, Quartier Himbi", beds: 1, baths: 1, sqm: 18, img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80", rating: 4.3, reviews: 9, views: "1.8K", available: "Septembre 2025", features: ["Proche université", "Meublé", "Eau & électricité inclus", "Calme"], landlord: "M. Lumumba", landlordAvatar: "LU", verified: true, colocataires: 2, colocatairesMax: 4 },
];

const BUDGET_OPTIONS = ["Tout", "< $100/m", "$100–250/m", "$250–500/m", "> $500/m"];
const CITY_OPTIONS = ["Toutes villes", "Kinshasa", "Lubumbashi", "Goma", "Kolwezi", "Bukavu"];

function RentEstimator() {
  const [sqm, setSqm] = useState(80);
  const [city, setCity] = useState("Lubumbashi");
  const [type, setType] = useState<"studio" | "appart" | "maison">("appart");
  const BASE: Record<string, number> = { Kinshasa: 4.5, Lubumbashi: 3.8, Goma: 3.2, Kolwezi: 2.9, Bukavu: 2.5 };
  const TYPE_MULT: Record<string, number> = { studio: 0.9, appart: 1.0, maison: 1.2 };
  const estimate = Math.round((BASE[city] ?? 3) * sqm * TYPE_MULT[type]);

  return (
    <View className="rounded-3xl p-4 space-y-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <View className="flex items-center gap-2 mb-1"><Calculator size={18} className="text-purple-400" /><Text className="text-sm font-bold text-white">Estimateur de loyer</Text></View>
      <View>
        <Text className="text-xs text-white/40 mb-1.5">Ville</Text>
        <View className="flex flex-wrap gap-2">
          {["Kinshasa", "Lubumbashi", "Goma", "Kolwezi"].map((c) => (
            <Pressable key={c} onPress={() => setCity(c)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={city === c ? {  } : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{c}</Pressable>
          ))}
        </View>
      </View>
      <View>
        <Text className="text-xs text-white/40 mb-1.5">Type de logement</Text>
        <View className="flex gap-2">
          {(["studio", "appart", "maison"] as const).map((t) => (
            <Pressable key={t} onPress={() => setType(t)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize"
              style={type === t ? { backgroundColor: "rgba(249,115,22,0.2)", borderWidth: 1, borderColor: "rgba(249,115,22,0.4)", borderStyle: "solid" } : { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{t}</Pressable>
          ))}
        </View>
      </View>
      <View>
        <View className="flex justify-between mb-1.5"><Text className="text-xs text-white/40">Surface</Text><Text className="text-xs font-bold text-purple-400">{sqm} m²</Text></View>
        <TextInput min={15} max={300} value={sqm} onChangeText={(text) => setSqm(Number(text))} className="w-full" />
      </View>
      <View className="rounded-2xl p-3 text-center" style={{ borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}>
        <Text className="text-xs text-white/50 mb-1">Loyer mensuel estimé</Text>
        <Text className="text-3xl font-black" style={{ color: "#10B981" }}>${estimate}</Text>
        <Text className="text-xs text-white/40 mt-0.5">${(estimate / sqm).toFixed(1)} / m² · {city}</Text>
      </View>
    </View>
  );
}

function ListingCard({ listing, onSelect, onFavorite, isFav }: { listing: Listing; onSelect: () => void; onFavorite: () => void; isFav: boolean }) {
  return (
    <Pressable className="rounded-3xl overflow-hidden mb-3"
      style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={onSelect}>
      <View className="relative h-44">
        <Image className="w-full h-full object-cover"  source={{ uri: listing.img }} accessibilityLabel={listing.title}/>
        <View className="absolute inset-0" style={{  }} />
        <Text className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: listing.tagColor }}>{listing.tag}</Text>
        <Pressable onPress={(e) => { onFavorite(); }} className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <Heart size={14} className={isFav ? "text-red-400 fill-red-400" : "text-white"} />
        </Pressable>
        <View className="absolute bottom-3 left-3">
          <Text className="text-2xl font-black" style={{ color: listing.priceColor }}>{listing.price}</Text>
          <View className="flex items-center gap-1 text-xs text-white/60"><MapPin size={10} />{listing.address}</View>
        </View>
        <View className="absolute bottom-3 right-3 flex items-center gap-1 text-white/60 text-xs"><Eye size={11} />{listing.views}</View>
      </View>
      <View className="p-3">
        <View className="flex items-start justify-between mb-2">
          <Text className="text-sm font-semibold text-white leading-tight">{listing.title}</Text>
          {listing.verified && <CheckCircle size={14} className="text-green-400 flex-shrink-0 mt-0.5 ml-1" />}
        </View>
        <View className="flex items-center gap-3 mb-2">
          <View className="flex items-center gap-1 text-white/50 text-xs"><Bed size={12} />{listing.beds} <Text>ch.</Text></View>
          <View className="flex items-center gap-1 text-white/50 text-xs"><Bath size={12} />{listing.baths} <Text>sdb</Text></View>
          <View className="flex items-center gap-1 text-white/50 text-xs"><Maximize2 size={12} />{listing.sqm} <Text>m²</Text></View>
          {listing.colocataires !== undefined && <View className="flex items-center gap-1 text-blue-400 text-xs"><Users size={12} />{listing.colocataires}<Text>/</Text>{listing.colocatairesMax}</View>}
        </View>
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-1"><Star size={11} className="text-yellow-400 fill-yellow-400" /><Text className="text-xs text-white/70">{listing.rating} ({listing.reviews} avis)</Text></View>
          <Text className="text-xs text-green-400">{listing.available}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ListingDetail({ listing, onClose, isFav, onFavorite, isBooked, onToggleBooking }: {
  listing: Listing; onClose: () => void; isFav: boolean; onFavorite: () => void;
  isBooked: boolean; onToggleBooking: () => void;
}) {
  const [showContact, setShowContact] = useState(false);

  return (
    <View
      className="absolute inset-0 z-50 flex flex-col overflow-y-auto" style={{  }}>
      <View className="relative h-64 flex-shrink-0">
        <Image className="w-full h-full object-cover"  source={{ uri: listing.img }} accessibilityLabel={listing.title}/>
        <View className="absolute inset-0" style={{  }} />
        <Pressable onPress={onClose} className="absolute top-4 left-4 w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View className="absolute top-4 right-4 flex gap-2">
          <Pressable onPress={onFavorite} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <Heart size={16} className={isFav ? "text-red-400 fill-red-400" : "text-white"} />
          </Pressable>
          <Pressable className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <Share2 size={16} className="text-white" />
          </Pressable>
        </View>
        <View className="absolute bottom-4 left-4">
          <Text className="px-2.5 py-1 rounded-full text-xs font-bold text-white mr-2" style={{ backgroundColor: listing.tagColor }}>{listing.tag}</Text>
          <Text className="text-3xl font-black mt-1" style={{ color: listing.priceColor }}>{listing.price}</Text>
        </View>
      </View>
      <View className="flex-1 p-4 space-y-4">
        <View>
          <View className="flex items-start justify-between">
            <Text className="text-lg font-bold text-white">{listing.title}</Text>
            {listing.verified && <CheckCircle size={18} className="text-green-400 mt-0.5" />}
          </View>
          <View className="flex items-center gap-1 text-white/50 text-sm mt-1"><MapPin size={13} />{listing.address}</View>
          <View className="flex items-center gap-1 mt-1"><Star size={13} className="text-yellow-400 fill-yellow-400" /><Text className="text-sm text-white/70">{listing.rating} · {listing.reviews} avis · {listing.views} vues</Text></View>
        </View>
        <View className="gap-2">
          {[{ icon: Bed, label: `${listing.beds} chambres` }, { icon: Bath, label: `${listing.baths} salles de bain` }, { icon: Maximize2, label: `${listing.sqm} m²` }].map(({ icon: Icon, label }) => (
            <View key={label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <Icon size={18} className="text-purple-400 mx-auto mb-1" />
              <Text className="text-xs text-white/70">{label}</Text>
            </View>
          ))}
        </View>
        <View>
          <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Équipements</Text>
          <View className="flex flex-wrap gap-2">
            {listing.features.map((f) => <Text key={f} className="px-3 py-1 rounded-full text-xs text-white/80" style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}>{f}</Text>)}
          </View>
        </View>
        <View className="rounded-2xl p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
          <Calendar size={18} className="text-green-400" />
          <View><Text className="text-xs text-white/50">Disponible</Text><Text className="text-sm font-semibold text-green-400">{listing.available}</Text></View>
        </View>
        <View className="rounded-2xl p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
          <View className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{  }}>{listing.landlordAvatar}</View>
          <View className="flex-1"><Text className="text-sm font-semibold text-white">{listing.landlord}</Text><Text className="text-xs text-white/50">Propriétaire / Bailleur</Text></View>
          {listing.verified && <CheckCircle size={14} className="text-green-400" />}
        </View>
        {listing.colocataires !== undefined && (
          <View className="rounded-2xl p-3" style={{ backgroundColor: "rgba(59,130,246,0.1)", borderWidth: 1, borderColor: "rgba(59,130,246,0.2)", borderStyle: "solid" }}>
            <Text className="text-xs text-blue-400 font-semibold mb-1">Colocataires</Text>
            <View className="flex items-center gap-2">
              <View className="flex -space-x-2">
                {Array.from({ length: listing.colocataires }).map((_, i) => (
                  <View key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-black" style={{ backgroundColor: `hsl(${i * 60 + 200},70%,50%)` }}>{String.fromCharCode(65 + i)}</View>
                ))}
              </View>
              <Text className="text-xs text-white/70">{listing.colocataires} / {listing.colocatairesMax} places occupées</Text>
            </View>
          </View>
        )}
        <>
          {showContact && (
            <View
              className="rounded-2xl p-3 space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <Text className="text-xs text-white/50 font-semibold uppercase tracking-wider">Contacter</Text>
              <Pressable className="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white" style={{ backgroundColor: "rgba(16,185,129,0.2)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}>
                <Phone size={14} className="text-green-400" /> <Text>+243 997 123 456</Text></Pressable>
              <Pressable className="w-full py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white" style={{ backgroundColor: "rgba(59,130,246,0.2)", borderWidth: 1, borderColor: "rgba(59,130,246,0.3)", borderStyle: "solid" }}>
                <MessageCircle size={14} className="text-blue-400" /> <Text>Envoyer un message</Text></Pressable>
            </View>
          )}
        </>
        <View className="flex gap-2 pb-4">
          <Pressable onPress={() => setShowContact((v) => !v)} className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }}>
            <Phone size={15} className="text-white/70" />
            <Text className="text-white/80">Contacter</Text>
            {showContact ? <ChevronUp size={14} className="text-white/50" /> : <ChevronDown size={14} className="text-white/50" />}
          </Pressable>
          <Pressable onPress={onToggleBooking} className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white"
            style={{  }}>
            {isBooked ? <><CheckCircle size={15} /> <Text>Visite réservée</Text></> : <><Calendar size={15} /> <Text>Réserver visite</Text></>}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LogementContent() {
  const housingData = useQuery(api.urban.getHousingData);
  const toggleFavorite = useMutation(api.urban.toggleHousingFavorite);
  const toggleBooking = useMutation(api.urban.toggleVisitBooking);

  const favorites = housingData?.favorites ?? [];
  const bookings = housingData?.bookings ?? [];

  const handleFavorite = async (listingId: string) => {
    try { await toggleFavorite({ listingId }); } catch { UIService.openToast("Erreur", "error"); }
  };
  const handleBooking = async (listingId: string) => {
    try {
      const booked = await toggleBooking({ listingId });
      UIService.openToast(booked ? "Visite réservée !" : "Réservation annulée", "success");
    } catch { UIService.openToast("Erreur", "error"); }
  };

  return { favorites, bookings, handleFavorite, handleBooking };
}

export default function LogementPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>("location");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [budget, setBudget] = useState("Tout");
  const [city, setCity] = useState("Toutes villes");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showEstimator, setShowEstimator] = useState(false);
  const [alertSet, setAlertSet] = useState(false);

  // Local fallback state for unauthenticated users
  const [localFavorites, setLocalFavorites] = useState<string[]>([]);
  const [localBookings, setLocalBookings] = useState<string[]>([]);

  const housingData = useQuery(api.urban.getHousingData);
  const toggleFavorite = useMutation(api.urban.toggleHousingFavorite);
  const toggleBooking = useMutation(api.urban.toggleVisitBooking);

  const favorites = housingData?.favorites ?? localFavorites;
  const bookings = housingData?.bookings ?? localBookings;

  const handleFavorite = async (listingId: string) => {
    try {
      await toggleFavorite({ listingId });
    } catch {
      setLocalFavorites(prev => prev.includes(listingId) ? prev.filter(x => x !== listingId) : [...prev, listingId]);
    }
  };

  const handleBooking = async (listingId: string) => {
    try {
      await toggleBooking({ listingId });
    } catch {
      setLocalBookings(prev => {
        if (prev.includes(listingId)) return prev.filter(x => x !== listingId);
        UIService.openToast("Visite réservée !", "success");
        return [...prev, listingId];
      });
    }
  };

  const filtered = LISTINGS.filter((l) => {
    if (l.type !== tab) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.address.toLowerCase().includes(search.toLowerCase())) return false;
    if (city !== "Toutes villes" && !l.address.includes(city)) return false;
    return true;
  });

  const TABS: { id: TabId; label: string; icon: typeof Home; color: string }[] = [
    { id: "location", label: "Location", icon: Home, color: "#F97316" },
    { id: "achat", label: "Achat", icon: TrendingUp, color: "#8B5CF6" },
    { id: "colocation", label: "Colocation", icon: Users, color: "#3B82F6" },
  ];

  return (
    <View className="relative h-full w-full overflow-hidden flex flex-col" style={{  }}>
      <View className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{  }} />
      <View className="absolute bottom-20 left-0 w-48 h-48 rounded-full" style={{  }} />

      <View className="flex-shrink-0 px-4 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-black text-white">Logement Pro</Text>
            <Text className="text-xs text-white/40">Trouvez votre prochain chez-vous</Text>
          </View>
          <Pressable onPress={() => setAlertSet((v) => !v)} className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: alertSet ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.08)", borderColor: "rgba(249,115,22,0.4)", borderStyle: "solid" }}>
            <Bell size={16} className={alertSet ? "text-orange-400" : "text-white/60"} />
          </Pressable>
          <Pressable onPress={() => setShowEstimator((v) => !v)} className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(139,92,246,0.15)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }}>
            <Calculator size={16} className="text-purple-400" />
          </Pressable>
        </View>

        <View className="flex gap-2 mb-3">
          <View className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
            <Search size={14} className="text-white/40" />
            <TextInput value={search} onChangeText={(text) => setSearch(text)} placeholder="Ville, quartier, type..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
            {search && <Pressable onPress={() => setSearch("")}><X size={13} className="text-white/40" /></Pressable>}
          </View>
          <Pressable onPress={() => setShowFilters((v) => !v)} className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: showFilters ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.07)", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}>
            <SlidersHorizontal size={16} className={showFilters ? "text-purple-400" : "text-white/60"} />
          </Pressable>
        </View>

        <>
          {showFilters && (
            <View className="mb-3 space-y-2 overflow-hidden">
              <View>
                <Text className="text-xs text-white/40 mb-1.5">Ville</Text>
                <View className="flex gap-1.5 overflow-x-auto pb-1" style={{  }}>
                  {CITY_OPTIONS.map((c) => <Pressable key={c} onPress={() => setCity(c)} className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={city === c ? {  } : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{c}</Pressable>)}
                </View>
              </View>
              <View>
                <Text className="text-xs text-white/40 mb-1.5">Budget</Text>
                <View className="flex gap-1.5 overflow-x-auto pb-1" style={{  }}>
                  {BUDGET_OPTIONS.map((b) => <Pressable key={b} onPress={() => setBudget(b)} className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={budget === b ? { backgroundColor: "rgba(249,115,22,0.2)", borderWidth: 1, borderColor: "rgba(249,115,22,0.4)", borderStyle: "solid" } : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{b}</Pressable>)}
                </View>
              </View>
            </View>
          )}
        </>

        <View className="flex gap-2">
          {TABS.map(({ id, label, icon: Icon, color }) => (
            <Pressable key={id} onPress={() => setTab(id)} className="flex-1 py-2.5 rounded-2xl flex flex-col items-center gap-1"
              style={tab === id ? { backgroundColor: `${color}22`, borderStyle: "solid" } : { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <Icon size={16} style={{ color: tab === id ? color : "rgba(255,255,255,0.4)" }} />
              <Text className="text-xs font-semibold" style={{ color: tab === id ? color : "rgba(255,255,255,0.4)" }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6" style={{  }}>
        <>
          {showEstimator && (
            <View className="mb-4">
              <RentEstimator />
            </View>
          )}
        </>
        <View className="flex items-center justify-between mb-3 mt-1">
          <Text className="text-xs text-white/40">{filtered.length} annonce{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}</Text>
          <View className="flex items-center gap-1 text-xs text-white/40">
            <Bookmark size={11} className="text-red-400" />
            <Text className="text-red-400">{favorites.length} <Text>favoris</Text></Text>
          </View>
        </View>
        <>
          <View key={tab}>
            {filtered.length === 0 ? (
              <View className="text-center py-16">
                <Home size={40} className="text-white/20 mx-auto mb-3" />
                <Text className="text-white/40 text-sm"><Text>Aucune annonce trouvée</Text></Text>
                <Text className="text-white/25 text-xs mt-1"><Text>Modifiez vos filtres</Text></Text>
              </View>
            ) : (
              filtered.map((listing) => (
                <ListingCard key={listing.id} listing={listing}
                  onSelect={() => setSelectedListing(listing)}
                  onFavorite={() => { void handleFavorite(listing.id); }}
                  isFav={favorites.includes(listing.id)} />
              ))
            )}
          </View>
        </>
      </View>

      <>
        {alertSet && (
          <View
            className="absolute bottom-6 left-4 right-4 rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: "rgba(249,115,22,0.15)", borderWidth: 1, borderColor: "rgba(249,115,22,0.3)", borderStyle: "solid" }}>
            <Bell size={16} className="text-orange-400" />
            <Text className="text-sm text-white/80 flex-1"><Text>Alerte activée — vous serez notifié des nouvelles annonces</Text></Text>
            <Pressable onPress={() => setAlertSet(false)}><X size={14} className="text-white/40" /></Pressable>
          </View>
        )}
      </>

      <>
        {selectedListing && (
          <ListingDetail listing={selectedListing} onClose={() => setSelectedListing(null)}
            isFav={favorites.includes(selectedListing.id)}
            onFavorite={() => { void handleFavorite(selectedListing.id); }}
            isBooked={bookings.includes(selectedListing.id)}
            onToggleBooking={() => { void handleBooking(selectedListing.id); }} />
        )}
      </>
    </View>
  );
}
