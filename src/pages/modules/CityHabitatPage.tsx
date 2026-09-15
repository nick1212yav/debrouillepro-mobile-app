import { View, Pressable, Text, TextInput, Image } from "react-native";
import { useState, useMemo } from "react";
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useDebounce } from "@/hooks/use-debounce.ts";
import {
  ArrowLeft, Home, MapPin, Search, Star, Heart, Phone, MessageCircle,
  X, Wifi, Car, Zap, Droplets, Shield, CheckCircle,
  Users, Clock, CreditCard, Building2, Key, AlertCircle, Bell, Send, Loader2,
} from "lucide-react-native";

// ─── Static data ─────────────────────────────────────────────────────────────

const SERVICES = [
  { id: 1, name: "Demande de raccordement EDF/CIE", icon: Zap, color: "#F59E0B", status: "En ligne" },
  { id: 2, name: "Abonnement eau SODECI", icon: Droplets, color: "#3B82F6", status: "En ligne" },
  { id: 3, name: "Déclaration sinistre logement", icon: AlertCircle, color: "#EF4444", status: "En ligne" },
  { id: 4, name: "Paiement loyer en ligne", icon: CreditCard, color: "#10B981", status: "Disponible" },
  { id: 5, name: "Gestion copropriété", icon: Building2, color: "#8B5CF6", status: "Bêta" },
  { id: 6, name: "Alerte sécurité quartier", icon: Bell, color: "#F97316", status: "En ligne" },
];

const AMENITY_LABELS: Record<string, string> = {
  wifi: "WiFi", parking: "Parking", securite: "Sécurité",
  eau: "Eau courante", electricite: "Électricité", garden: "Jardin",
  piscine: "Piscine", gym: "Salle de sport", gardien: "Gardien",
};
const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi, parking: Car, securite: Shield, eau: Droplets, electricite: Zap,
  garden: Users, piscine: Droplets, gym: Users, gardien: Shield,
};

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement", maison: "Maison", villa: "Villa",
  studio: "Studio", bureau: "Bureau", terrain: "Terrain",
  chambre: "Chambre", entrepot: "Entrepôt",
};

const TAG_COLORS: Record<string, string> = {
  location: "rgba(16,185,129,0.7)",
  vente: "rgba(99,102,241,0.7)",
};

const COMMUNITY_POSTS = [
  { author: "Mairie de Cocody", content: "Travaux de voirie rue 12 : circulation déviée du 20 au 27 jan.", time: "Il y a 2h", type: "Info", color: "#6366F1" },
  { author: "Comité résidence", content: "Réunion copropriétaires samedi 25 jan à 10h en salle commune.", time: "Hier", type: "Événement", color: "#F59E0B" },
  { author: "Voisin – Ama K.", content: "Perdu : chatte rousse répondant au nom de Mimi. Récompense.", time: "Il y a 2j", type: "Annonce", color: "#EF4444" },
  { author: "Comité sécurité", content: "Rappel : fermer le portail principal après 22h. Merci à tous.", time: "Il y a 3j", type: "Sécurité", color: "#10B981" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = "residences" | "services" | "communaute";

type PropertyWithOwner = {
  _id: Id<"properties">;
  _creationTime: number;
  ownerId: Id<"users">;
  title: string;
  description: string;
  type: string;
  transactionType: string;
  price: number;
  currency: string;
  surface?: number;
  rooms?: number;
  bathrooms?: number;
  images: string[];
  city: string;
  neighborhood?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  status: string;
  featured: boolean;
  ownerName?: string;
  ownerAvatar?: string;
  ownerPhone?: string;
};

// ─── Skeleton loaders ────────────────────────────────────────────────────────

function PropertyCardSkeleton() {
  return (
    <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Skeleton className="w-full h-40 rounded-none" /><View className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><View className="flex gap-3 mt-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /></View></View></View>
  );
}

function ServiceRequestSkeleton() {
  return (
    <View className="p-3 rounded-xl space-y-2" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-1/3" /></View>
  );
}

// ─── Social Housing Form ─────────────────────────────────────────────────────

function SocialHousingForm() {
  const submitRequest = useMutation(api.realestate.submitSocialHousingRequest);
  const [householdSize, setHouseholdSize] = useState("2");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [currentSituation, setCurrentSituation] = useState("");
  const [preferredCity, setPreferredCity] = useState("Abidjan");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentSituation.trim()) {
      toast.error("Veuillez décrire votre situation actuelle");
      return;
    }
    setSubmitting(true);
    try {
      await submitRequest({
        householdSize: parseInt(householdSize) || 1,
        monthlyIncome: monthlyIncome ? parseInt(monthlyIncome) : undefined,
        currentSituation: currentSituation.trim(),
        preferredCity: preferredCity.trim(),
        notes: notes.trim() || undefined,
      });
      toast.success("Demande soumise avec succès !");
      setCurrentSituation("");
      setNotes("");
    } catch {
      toast.error("Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}><Text className="text-white font-semibold text-sm flex items-center gap-2"><Building2 size={14} className="text-indigo-400" />Nouvelle demande de logement social
      </Text><View className="gap-2"><View><Text className="text-white/40 text-xs">Ménage (pers.)</Text><TextInput value={householdSize} onChangeText={value => setHouseholdSize(value)} className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none" keyboardType="numeric" /></View><View><Text className="text-white/40 text-xs">Revenu mensuel (FCFA)</Text><TextInput value={monthlyIncome} onChangeText={value => setMonthlyIncome(value)} placeholder="Optionnel" className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/20" keyboardType="numeric" /></View></View><View><Text className="text-white/40 text-xs">Situation actuelle *</Text><TextInput value={currentSituation} onChangeText={value => setCurrentSituation(value)} placeholder="Ex: Locataire en difficulté, hébergé chez un proche..." className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/20" /></View><View><Text className="text-white/40 text-xs">Ville préférée</Text><TextInput value={preferredCity} onChangeText={value => setPreferredCity(value)} className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none" /></View><View><Text className="text-white/40 text-xs">Notes additionnelles</Text><TextInput value={notes} onChangeText={value => setNotes(value)} placeholder="Précisions optionnelles..." className="w-full mt-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/20" multiline textAlignVertical="top" /></View><Pressable onPress={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{  }}>{submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{submitting ? "Envoi..." : "Soumettre la demande"}</Pressable></View>
  );
}

// ─── My Requests List ────────────────────────────────────────────────────────

function MySocialHousingRequests() {
  const requests = useQuery(api.realestate.getMySocialHousingRequests);

  if (requests === undefined) {
    return (
      <View className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <ServiceRequestSkeleton key={i} />)}</View>
    );
  }

  if (requests.length === 0) return null;

  const statusColors: Record<string, string> = {
    pending: "#F59E0B",
    reviewing: "#6366F1",
    approved: "#10B981",
    rejected: "#EF4444",
  };
  const statusLabels: Record<string, string> = {
    pending: "En attente",
    reviewing: "En cours d'examen",
    approved: "Approuvée",
    rejected: "Refusée",
  };

  return (
    <View className="space-y-2"><Text className="text-white font-semibold text-sm flex items-center gap-2"><Clock size={14} className="text-amber-400" />Mes demandes ({requests.length})
      </Text>{requests.map((req) => (
        <View key={req._id} className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View className="flex items-center justify-between"><Text className="text-white/70 text-xs">{req.preferredCity}– {req.householdSize}pers.</Text><Text className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${statusColors[req.status] ?? "#6366F1"}20`, color: statusColors[req.status] ?? "#6366F1" }}>{statusLabels[req.status] ?? req.status}</Text></View><Text className="text-white/50 text-xs mt-1 truncate">{req.currentSituation}</Text></View>
      ))}</View>
  );
}

// ─── Property Detail ─────────────────────────────────────────────────────────

function PropertyDetail({
  propertyId,
  onClose,
  isFavorited,
  onToggleFavorite,
}: {
  propertyId: Id<"properties">;
  onClose: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}) {
  const property = useQuery(api.realestate.getProperty, { id: propertyId });
  const createRequest = useMutation(api.realestate.createPropertyRequest);
  const [contactSending, setContactSending] = useState(false);

  const handleContact = async () => {
    if (!property) return;
    setContactSending(true);
    try {
      await createRequest({
        propertyId: property._id,
        message: `Bonjour, je suis intéressé(e) par "${property.title}". Merci de me contacter.`,
      });
      toast.success("Demande de contact envoyée !");
    } catch {
      toast.error("Veuillez vous connecter pour contacter le propriétaire");
    } finally {
      setContactSending(false);
    }
  };

  if (!property) {
    return (
      <View className="absolute inset-0 z-50 flex flex-col" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} style={{  }}>
        <View className="flex-1 flex items-center justify-center"><Loader2 size={28} className="text-green-400 animate-spin" /></View>
      </View>
    );
  }

  const mainImage = property.images[0] ?? "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&q=80";

  return (
    <View className="absolute inset-0 z-50 flex flex-col" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} style={{  }}>
      <View className="relative flex-shrink-0"><Image className="w-full h-52 object-cover" source={{ uri: mainImage }} accessibilityLabel={property.title} /><View className="absolute inset-0" style={{  }} /><Pressable onPress={onClose} className="absolute top-12 left-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><X size={20} className="text-white" /></Pressable><Pressable onPress={onToggleFavorite} className="absolute top-12 right-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><Heart size={18} className={isFavorited ? "fill-rose-500 text-rose-500" : "text-white"} /></Pressable><View className="absolute bottom-4 left-4 right-4"><Text className="px-2 py-1 rounded-lg text-xs font-semibold text-white mr-2" style={{ backgroundColor: TAG_COLORS[property.transactionType] ?? "rgba(16,185,129,0.7)" }}>{property.transactionType === "location" ? "Location" : "Vente"}</Text><Text className="text-white text-xl font-bold mt-1">{property.title}</Text><View className="flex items-center gap-2 mt-1"><MapPin size={12} className="text-white/60" /><Text className="text-white/60 text-xs">{property.city}{property.neighborhood ? `, ${property.neighborhood}` : ""}</Text></View></View></View>

      <View className="flex-1 overflow-y-auto px-4 pb-6 pt-4"><Text className="text-white/70 text-sm mb-4">{property.description}</Text><View className="gap-3 mb-4">{[
            { label: "Prix", value: `${(property.price / 1000).toFixed(0)}k` },
            { label: "Surface", value: property.surface ? `${property.surface}m²` : "–" },
            { label: "Pièces", value: property.rooms ? String(property.rooms) : "–" },
          ].map(({ label, value }) => (
            <View key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><Text className="text-green-400 font-bold text-lg">{value}</Text><Text className="text-white/50 text-xs">{label}</Text></View>
          ))}</View>{property.amenities.length > 0 && (
          <>
            <Text className="text-white font-semibold text-sm mb-2">Équipements & Services</Text>
            <View className="flex flex-wrap gap-2 mb-4">{property.amenities.map(a => {
                const Icon = AMENITY_ICONS[a] ?? CheckCircle;
                return (
                  <View key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><Icon size={13} className="text-green-400" /><Text className="text-white/70 text-xs">{AMENITY_LABELS[a] ?? a}</Text></View>
                );
              })}</View>
          </>
        )}{(property as PropertyWithOwner).ownerName && (
          <View className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><View className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{  }}>{((property as PropertyWithOwner).ownerName ?? "P")[0].toUpperCase()}</View><View className="flex-1"><Text className="text-white text-sm font-medium">{(property as PropertyWithOwner).ownerName}</Text><View className="flex items-center gap-1"><CheckCircle size={11} className="text-green-400" /><Text className="text-green-400 text-xs">Propriétaire vérifié</Text></View></View></View>
        )}<View className="flex gap-3"><Authenticated><Pressable onPress={handleContact} disabled={contactSending} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold disabled:opacity-50" style={{  }}>{contactSending ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}{contactSending ? "Envoi..." : "Contacter"}</Pressable><Pressable onPress={onToggleFavorite} className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Heart size={16} className={isFavorited ? "fill-rose-500 text-rose-500" : "text-white"} /><Text className="text-white text-sm">{isFavorited ? "Sauvegardé" : "Sauvegarder"}</Text></Pressable></Authenticated><Unauthenticated><View className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><SignInButton /></View></Unauthenticated></View></View>
    </View>
  );
}

// ─── Residences Tab Content ──────────────────────────────────────────────────

function ResidencesTab({ search }: { search: string }) {
  const [debouncedSearch] = useDebounce(search, 400);
  const [selectedId, setSelectedId] = useState<Id<"properties"> | null>(null);

  // Paginated listing
  const { results: properties, status: paginationStatus, loadMore } = usePaginatedQuery(
    api.realestate.listProperties,
    { status: "available" },
    { initialNumItems: 12 },
  );

  // Search results (used when user types)
  const searchResults = useQuery(
    api.realestate.searchProperties,
    debouncedSearch.length >= 2 ? { q: debouncedSearch } : "skip",
  );

  // Housing favorites (for auth'd users)
  const housingData = useQuery(api.urban.getHousingData);
  const toggleFavorite = useMutation(api.urban.toggleHousingFavorite);

  const favorites = housingData?.favorites ?? [];

  const isSearching = debouncedSearch.length >= 2;
  const displayProperties = isSearching ? (searchResults ?? []) : (properties ?? []);
  const isLoading = isSearching ? searchResults === undefined : properties === undefined;

  const handleToggleFavorite = async (propertyId: string) => {
    try {
      await toggleFavorite({ listingId: propertyId });
    } catch {
      toast.error("Connectez-vous pour sauvegarder");
    }
  };

  return (
    <>
      <View className="space-y-4">{isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)
        ) : displayProperties.length === 0 ? (
          <View className="text-center py-12"><Building2 size={36} className="text-white/20 mx-auto mb-3" /><Text className="text-white/50 text-sm">{isSearching ? "Aucun résultat trouvé" : "Aucune propriété disponible"}</Text></View>
        ) : (
          displayProperties.map((prop, i) => (
            <View key={prop._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease: "easeOut" }} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={() => setSelectedId(prop._id)}>
              <View className="relative"><Image className="w-full h-40 object-cover" source={{ uri: prop.images[0] ?? "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&q=80" }} accessibilityLabel={prop.title} /><View className="absolute inset-0" style={{  }} /><View className="absolute top-3 left-3 flex gap-1.5"><Text className="px-2 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: TAG_COLORS[prop.transactionType] ?? "rgba(16,185,129,0.7)" }}>{prop.transactionType === "location" ? "Location" : "Vente"}</Text>{prop.featured && (
                    <Text className="px-2 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: "rgba(245,158,11,0.7)" }}><Star size={10} className="inline mr-0.5" />Vedette
                    </Text>
                  )}</View><Pressable onPress={e => { handleToggleFavorite(prop._id); }} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}><Heart size={16} className={favorites.includes(prop._id) ? "fill-rose-500 text-rose-500" : "text-white"} /></Pressable><View className="absolute bottom-3 left-3 right-3"><Text className="text-white/70 text-xs">{TYPE_LABELS[prop.type] ?? prop.type}</Text></View></View>
              <View className="p-3"><View className="flex items-start justify-between mb-1"><View className="min-w-0 flex-1"><Text className="text-white font-semibold text-sm truncate">{prop.title}</Text><View className="flex items-center gap-1 mt-0.5"><MapPin size={11} className="text-white/40 flex-shrink-0" /><Text className="text-white/50 text-xs truncate">{prop.city}{prop.neighborhood ? `, ${prop.neighborhood}` : ""}</Text></View></View><View className="text-right flex-shrink-0 ml-2"><Text className="text-green-400 font-bold text-sm">{(prop.price / 1000).toFixed(0)}k</Text><Text className="text-white/40 text-xs">{prop.currency}/{prop.transactionType === "location" ? "mois" : "total"}</Text></View></View><View className="flex items-center gap-3 mt-2">{prop.rooms && (
                    <View className="flex items-center gap-1"><Building2 size={12} className="text-white/40" /><Text className="text-white/60 text-xs">{prop.rooms}pièces</Text></View>
                  )}{prop.surface && (
                    <Text className="text-white/60 text-xs">{prop.surface}m²</Text>
                  )}{prop.amenities.length > 0 && (
                    <Text className="text-green-400 text-xs ml-auto">{prop.amenities.length}équip.</Text>
                  )}</View></View>
            </View>
          ))
        )}{!isSearching && paginationStatus === "CanLoadMore" && (
          <Pressable onPress={() => loadMore(12)} className="w-full py-3 rounded-xl text-white/60 text-sm font-medium transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text>Charger plus de résidences</Text></Pressable>
        )}{!isSearching && paginationStatus === "LoadingMore" && (
          <View className="flex justify-center py-4"><Loader2 size={20} className="text-green-400 animate-spin" /></View>
        )}</View>

<View>
        {selectedId && (
          <PropertyDetail
            propertyId={selectedId}
            onClose={() => setSelectedId(null)}
            isFavorited={favorites.includes(selectedId)}
            onToggleFavorite={() => handleToggleFavorite(selectedId)}
          />
        )}
      </View>
    </>
  );
}

// ─── Services Tab Content ────────────────────────────────────────────────────

function ServicesTab() {
  return (
    <View className="space-y-4"><View className="p-4 rounded-2xl mb-2" style={{ backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}><Text className="text-white font-semibold text-sm mb-1">Mon logement</Text><View className="flex items-center gap-2"><Key size={14} className="text-green-400" /><Text className="text-white/60 text-sm">Consultez vos demandes ci-dessous</Text></View></View><Authenticated><MySocialHousingRequests /><SocialHousingForm /></Authenticated><Unauthenticated><View className="p-4 rounded-2xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Users size={24} className="text-white/30 mx-auto mb-2" /><Text className="text-white/50 text-sm mb-3">Connectez-vous pour soumettre une demande de logement social</Text><SignInButton /></View></Unauthenticated><AuthLoading><View className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <ServiceRequestSkeleton key={i} />)}</View></AuthLoading><Text className="text-white font-semibold text-sm">Services disponibles</Text><View className="gap-3">{SERVICES.map(({ id, name, icon: Icon, color, status }) => (
          <Pressable key={id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: id * 0.06, ease: "easeOut" }} className="p-4 rounded-xl text-left" style={{ backgroundColor: `${color}10`, borderStyle: "solid" }} onPress={() => toast.info(`${name} – bientôt disponible !`)}>
            <Icon size={22} style={{ color }} className="mb-2" />
            <Text className="text-white text-xs font-medium leading-tight">{name}</Text>
            <Text className="mt-2 inline-block px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${color}20`, color }}>{status}</Text>
          </Pressable>
        ))}</View></View>
  );
}

// ─── Community Tab Content ───────────────────────────────────────────────────

function CommunityTab() {
  return (
    <View className="space-y-4"><View className="gap-3 mb-2">{[
          { label: "Voisins actifs", value: "847", color: "#10B981" },
          { label: "Groupes", value: "12", color: "#6366F1" },
          { label: "Événements", value: "5", color: "#F59E0B" },
        ].map(({ label, value, color }) => (
          <View key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><Text className="font-bold text-xl" style={{ color }}>{value}</Text><Text className="text-white/50 text-xs">{label}</Text></View>
        ))}</View><Text className="text-white font-semibold text-sm">Actualités du quartier</Text>{COMMUNITY_POSTS.map((post, i) => (
        <View key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07, ease: "easeOut" }} className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
          <View className="flex items-center gap-2 mb-2"><View className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: `${post.color}40` }}>{post.author[0]}</View><Text className="text-white font-medium text-xs">{post.author}</Text><Text className="px-2 py-0.5 rounded text-xs ml-1" style={{ backgroundColor: `${post.color}20`, color: post.color }}>{post.type}</Text><Text className="text-white/30 text-xs ml-auto">{post.time}</Text></View>
          <Text className="text-white/70 text-sm">{post.content}</Text>
        </View>
      ))}</View>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CityHabitatPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabKey>("residences");
  const [search, setSearch] = useState("");

  return (
    <View className="h-full flex flex-col" style={{  }}>{}<View className="flex-shrink-0 px-4 pt-12 pb-3"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={20} className="text-white" /></Pressable><View className="flex-1"><Text className="text-xl font-bold text-white">City-Habitat</Text><Text className="text-xs text-white/50">Résidences, services & vie de quartier</Text></View><View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.2)" }}><Home size={18} className="text-green-400" /></View></View>{}<View className="flex gap-1 p-1 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{(["residences", "services", "communaute"] as const).map(t => (
            <Pressable key={t} onPress={() => setTab(t)} className="flex-1 py-2 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: tab === t ? "rgba(16,185,129,0.4)" : "transparent" }}>{t === "residences" ? "Résidences" : t === "services" ? "Services" : "Communauté"}</Pressable>
          ))}</View>{}{tab === "residences" && (
          <View className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Search size={16} className="text-white/40" /><TextInput value={search} onChangeText={value => setSearch(value)} placeholder="Résidence, quartier..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />{search && (
              <Pressable onPress={() => setSearch("")} className=""><X size={14} className="text-white/40" /></Pressable>
            )}</View>
        )}</View>{}<View className="flex-1 overflow-y-auto px-4 pb-6">{tab === "residences" && <ResidencesTab search={search} />}{tab === "services" && <ServicesTab />}{tab === "communaute" && <CommunityTab />}</View></View>
  );
}
