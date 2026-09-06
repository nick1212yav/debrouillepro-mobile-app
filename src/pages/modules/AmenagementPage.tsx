import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Ruler, MapPin, Search, Star, Phone, MessageCircle,
  X, CheckCircle, Clock, Palette, Hammer, Sofa,
  Lightbulb, TreePine, Camera, Plus
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import type { Doc, Id } from "@/convex/_generated/dataModel.d";

// Static fallback data
const STATIC_PROS = [
  {
    id: "static-1", name: "Studio Habitat Plus", specialty: "Architecture d'intérieur",
    location: "Cocody, Abidjan", rating: 4.9, reviews: 214,
    price: "Dès 150k FCFA", avatar: "HP",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&q=80",
    tags: ["Résidentiel", "Commercial"], available: true,
    skills: ["Plans 3D", "Décoration", "Suivi chantier", "Mobilier"],
    projects: 187, yearsExp: 12,
    desc: "Cabinet spécialisé dans la conception d'espaces intérieurs modernes et fonctionnels.",
    backendId: null as Id<"serviceProviders"> | null,
  },
  {
    id: "static-2", name: "BTP Excellence CI", specialty: "Construction & Rénovation",
    location: "Marcory, Abidjan", rating: 4.8, reviews: 389,
    price: "Devis gratuit", avatar: "BE",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    tags: ["Gros œuvre", "Second œuvre"], available: true,
    skills: ["Maçonnerie", "Charpente", "Plomberie", "Électricité"],
    projects: 312, yearsExp: 18,
    desc: "Entreprise BTP de référence avec plus de 300 chantiers réalisés en Côte d'Ivoire.",
    backendId: null as Id<"serviceProviders"> | null,
  },
  {
    id: "static-3", name: "Déco & Design", specialty: "Décoration d'intérieur",
    location: "Plateau, Abidjan", rating: 4.7, reviews: 156,
    price: "Dès 80k FCFA", avatar: "DD",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=80",
    tags: ["Décoration", "Mobilier"], available: true,
    skills: ["Home staging", "Peinture", "Éclairage", "Textile"],
    projects: 98, yearsExp: 7,
    desc: "Transformez votre espace avec des solutions décoratives personnalisées et abordables.",
    backendId: null as Id<"serviceProviders"> | null,
  },
  {
    id: "static-4", name: "Jardinerie Verte CI", specialty: "Paysagisme & Jardins",
    location: "Bingerville", rating: 4.6, reviews: 78,
    price: "Dès 50k FCFA", avatar: "JV",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80",
    tags: ["Jardin", "Extérieur"], available: false,
    skills: ["Gazon", "Arbustes", "Irrigation", "Entretien"],
    projects: 65, yearsExp: 9,
    desc: "Création et entretien de jardins, parcs et espaces verts résidentiels.",
    backendId: null as Id<"serviceProviders"> | null,
  },
  {
    id: "static-5", name: "Lumière & Co", specialty: "Éclairage d'ambiance",
    location: "Deux Plateaux, Abidjan", rating: 4.8, reviews: 92,
    price: "Dès 60k FCFA", avatar: "LC",
    image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&q=80",
    tags: ["Éclairage", "Domotique"], available: true,
    skills: ["LED", "Domotique", "Basse consommation", "Design lumière"],
    projects: 74, yearsExp: 6,
    desc: "Spécialiste de l'éclairage LED et des systèmes domotiques pour habitat et bureaux.",
    backendId: null as Id<"serviceProviders"> | null,
  },
];

const INSPIRATIONS = [
  { title: "Salon moderne minimaliste", style: "Minimaliste", image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&q=80", likes: 1240 },
  { title: "Cuisine ouverte contemporaine", style: "Contemporain", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80", likes: 987 },
  { title: "Chambre cosy africaine", style: "Afro-chic", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80", likes: 2150 },
  { title: "Bureau home office zen", style: "Zen", image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80", likes: 765 },
];

const SPECS = ["Tout", "Architecture d'intérieur", "Construction & Rénovation", "Décoration d'intérieur", "Paysagisme & Jardins", "Éclairage d'ambiance"];
const SPEC_ICONS: Record<string, typeof Ruler> = {
  "Architecture d'intérieur": Palette, "Construction & Rénovation": Hammer,
  "Décoration d'intérieur": Sofa, "Paysagisme & Jardins": TreePine,
  "Éclairage d'ambiance": Lightbulb, "Tout": Ruler,
};

type DisplayPro = {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  price: string;
  avatar: string;
  image: string;
  tags: string[];
  available: boolean;
  skills: string[];
  projects: number;
  yearsExp: number;
  desc: string;
  backendId: Id<"serviceProviders"> | null;
};

function mapProviderToDisplay(provider: Doc<"serviceProviders">): DisplayPro {
  return {
    id: provider._id,
    name: provider.name,
    specialty: provider.specialty,
    location: provider.location,
    rating: provider.rating,
    reviews: provider.reviewCount,
    price: provider.price,
    avatar: provider.name.slice(0, 2).toUpperCase(),
    image: provider.imageUrl ?? "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&q=80",
    tags: [provider.category],
    available: provider.available,
    skills: provider.skills,
    projects: 0,
    yearsExp: 0,
    desc: provider.description,
    backendId: provider._id,
  };
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({
  provider,
  onClose,
}: {
  provider: DisplayPro;
  onClose: () => void;
}) {
  const book = useMutation(api.serviceProviders.book);
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      UIService.openToast("Veuillez écrire un message", "error");
      return;
    }
    if (!provider.backendId) {
      UIService.openToast("Ce prestataire n'est pas encore enregistré dans le système", "info");
      onClose();
      return;
    }
    setLoading(true);
    try {
      await book({
        providerId: provider.backendId,
        message: message.trim(),
        scheduledAt: scheduledAt || undefined,
      });
      UIService.openToast("Demande envoyée avec succès !", "success");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        UIService.openToast(data.message, "error");
      } else {
        UIService.openToast("Une erreur est survenue", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" };

  return (
    <View
      className="absolute inset-0 z-[60] flex flex-col"
      style={{  }}
    >
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Pressable onPress={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <X size={20} className="text-white" />
        </Pressable>
        <Text className="text-white text-lg font-bold flex-1">Contacter {provider.name}</Text>
      </View>
      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        <View className="p-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}>
          <View className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{  }}>{provider.avatar}</View>
          <View>
            <Text className="text-white font-medium text-sm">{provider.name}</Text>
            <Text className="text-amber-400/80 text-xs">{provider.specialty}</Text>
          </View>
        </View>
        <View>
          <Text className="text-white/60 text-xs mb-1 block">Votre message *</Text>
          <TextInput value={message} onChangeText={text => setMessage(text)}
            placeholder="Décrivez votre projet ou votre besoin..."
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle}  multiline textAlignVertical="top"/>
        </View>
        <View>
          <Text className="text-white/60 text-xs mb-1 block">Date souhaitée (optionnel)</Text>
          <TextInput value={scheduledAt} onChangeText={text => setScheduledAt(text)}
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle} />
        </View>
      </View>
      <View className="flex-shrink-0 px-4 pb-6">
        <Pressable onPress={handleSubmit} disabled={loading}
          className="w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50"
          style={{  }}>
          {loading ? "Envoi..." : "Envoyer la demande"}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Inner component (may be authed or unauthed) ──────────────────────────────
function AmenagementPageInner({ onBack, isAuthenticated }: { onBack: () => void; isAuthenticated: boolean }) {
  const [tab, setTab] = useState<"pros" | "inspiration" | "projet">("pros");
  const [filter, setFilter] = useState("Tout");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DisplayPro | null>(null);
  const [likedInsp, setLikedInsp] = useState<number[]>([]);
  const [bookingPro, setBookingPro] = useState<DisplayPro | null>(null);

  // Load service providers from backend with "Aménagement" or "BTP" category
  const amenagementProviders = useQuery(api.serviceProviders.list, { category: "Aménagement" });
  const btpProviders = useQuery(api.serviceProviders.list, { category: "BTP" });

  const isLoading = amenagementProviders === undefined || btpProviders === undefined;

  // Combine backend results
  const backendPros: DisplayPro[] = [
    ...(amenagementProviders ?? []).map(mapProviderToDisplay),
    ...(btpProviders ?? []).map(mapProviderToDisplay),
  ];

  // Use backend data if available, otherwise fall back to static
  const professionals: DisplayPro[] = backendPros.length > 0 ? backendPros : STATIC_PROS;

  const filtered = professionals.filter(p =>
    (filter === "Tout" || p.specialty === filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleContact = (pro: DisplayPro) => {
    if (!isAuthenticated) {
      UIService.openToast("Connectez-vous pour contacter un prestataire", "error");
      return;
    }
    setBookingPro(pro);
  };

  return (
    <View className="h-full flex flex-col" style={{  }}>
      <View className="flex-shrink-0 px-4 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Aménagement</Text>
            <Text className="text-xs text-white/50">Pros, inspiration & gestion de projet</Text>
          </View>
          <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.2)" }}>
            <Ruler size={18} className="text-amber-400" />
          </View>
        </View>

        <View className="flex gap-1 p-1 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {(["pros", "inspiration", "projet"] as const).map(t => (
            <Pressable key={t} onPress={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-medium capitalize"
              style={{ backgroundColor: tab === t ? "rgba(245,158,11,0.4)" : "transparent" }}>
              {t === "pros" ? "Professionnels" : t === "inspiration" ? "Inspiration" : "Mon Projet"}
            </Pressable>
          ))}
        </View>

        {tab === "pros" && (
          <>
            <View className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <Search size={16} className="text-white/40" />
              <TextInput value={search} onChangeText={text => setSearch(text)} placeholder="Architecte, décorateur..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
            </View>
            <View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SPECS.map(s => {
                const Icon = SPEC_ICONS[s] ?? Ruler;
                return (
                  <Pressable key={s} onPress={() => setFilter(s)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: filter === s ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.07)" }}>
                    <Icon size={12} />{s === "Architecture d'intérieur" ? "Archi" : s === "Construction & Rénovation" ? "BTP" : s === "Décoration d'intérieur" ? "Déco" : s === "Paysagisme & Jardins" ? "Jardin" : s === "Éclairage d'ambiance" ? "Éclairage" : s}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6">
        {tab === "pros" && (
          <View className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)
            ) : filtered.length === 0 ? (
              <Text className="text-white/40 text-sm text-center py-8">Aucun professionnel trouvé</Text>
            ) : (
              filtered.map((pro, i) => (
                <Pressable key={pro.id}
                  className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                  onPress={() => setSelected(pro)}>
                  <Image className="w-full h-36 object-cover"  source={{ uri: pro.image }} accessibilityLabel={pro.name}/>
                  <View className="p-3">
                    <View className="flex items-start gap-3">
                      <View className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 text-sm"
                        style={{  }}>{pro.avatar}</View>
                      <View className="flex-1 min-w-0">
                        <View className="flex items-start justify-between">
                          <View>
                            <Text className="text-white font-semibold text-sm">{pro.name}</Text>
                            <Text className="text-amber-400/80 text-xs">{pro.specialty}</Text>
                          </View>
                          <View className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /><Text className="text-white text-xs font-semibold">{pro.rating}</Text></View>
                        </View>
                        <View className="flex items-center gap-1 mt-1"><MapPin size={11} className="text-white/40" /><Text className="text-white/50 text-xs">{pro.location}</Text></View>
                      </View>
                    </View>
                    <View className="flex items-center gap-2 mt-2">
                      <Text className="text-amber-400 text-sm font-semibold">{pro.price}</Text>
                      {pro.projects > 0 && <Text className="text-white/30 text-xs ml-auto">{pro.projects} projets</Text>}
                      {!pro.available && <Text className="text-red-400 text-xs ml-auto">Indisponible</Text>}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {tab === "inspiration" && (
          <View className="gap-3">
            {INSPIRATIONS.map((insp, i) => (
              <View key={insp.title}
                className="rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="relative">
                  <Image className="w-full h-32 object-cover"  source={{ uri: insp.image }} accessibilityLabel={insp.title}/>
                  <View className="absolute inset-0" style={{  }} />
                  <Pressable onPress={() => setLikedInsp(l => l.includes(i) ? l.filter(x => x !== i) : [...l, i])}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <Camera size={13} className={likedInsp.includes(i) ? "text-rose-400" : "text-white"} />
                  </Pressable>
                </View>
                <View className="p-2.5" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <Text className="text-white text-xs font-medium leading-tight">{insp.title}</Text>
                  <View className="flex items-center justify-between mt-1">
                    <Text className="text-amber-400/80 text-xs">{insp.style}</Text>
                    <Text className="text-white/40 text-xs">{insp.likes.toLocaleString()} &#9829;</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === "projet" && (
          <View className="space-y-4">
            <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}>
              <View className="flex items-center gap-2 mb-3">
                <Hammer size={18} className="text-amber-400" />
                <Text className="text-white font-semibold">Mon projet en cours</Text>
              </View>
              <Text className="text-white font-medium">Rénovation Salon Principal</Text>
              <Text className="text-white/50 text-xs mt-0.5">Budget: 850 000 FCFA · 6 semaines</Text>
              <View className="flex items-center gap-2 mt-3">
                <View className="flex-1 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <View className="h-full w-2/5 rounded-full" style={{  }} />
                </View>
                <Text className="text-amber-400 text-xs font-semibold">40%</Text>
              </View>
            </View>
            <Text className="text-white font-semibold text-sm">Étapes du projet</Text>
            {[
              { step: "Consultation architecte", done: true, date: "10 jan" },
              { step: "Plans & devis validés", done: true, date: "18 jan" },
              { step: "Commande matériaux", done: true, date: "25 jan" },
              { step: "Travaux peinture", done: false, date: "En cours" },
              { step: "Pose parquet", done: false, date: "5 fév" },
              { step: "Décoration finale", done: false, date: "12 fév" },
            ].map((step, idx) => (
              <View key={step.step} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                <View className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: step.done ? "#10B981" : "rgba(255,255,255,0.1)" }}>
                  {step.done ? <CheckCircle size={14} className="text-white" /> : <Text className="text-white/40 text-xs">{idx + 1}</Text>}
                </View>
                <Text className={`flex-1 text-sm ${step.done ? "text-white line-through opacity-50" : "text-white"}`}>{step.step}</Text>
                <Text className={`text-xs ${step.done ? "text-green-400" : "text-white/40"}`}>{step.date}</Text>
              </View>
            ))}
            <Pressable className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-medium"
              style={{  }}>
              <Plus size={18} /><Text>Créer un nouveau projet</Text></Pressable>
          </View>
        )}
      </View>

      {/* Detail sheet */}
      <>
        {selected && (
          <View className="absolute inset-0 z-50 flex flex-col"
            style={{  }}>
            <View className="relative flex-shrink-0">
              <Image className="w-full h-52 object-cover"  source={{ uri: selected.image }} accessibilityLabel={selected.name}/>
              <View className="absolute inset-0" style={{  }} />
              <Pressable onPress={() => setSelected(null)} className="absolute top-12 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <X size={20} className="text-white" />
              </Pressable>
              <View className="absolute bottom-4 left-4 right-4">
                <Text className="text-white text-xl font-bold">{selected.name}</Text>
                <Text className="text-amber-400 text-sm">{selected.specialty}</Text>
                <View className="flex items-center gap-2 mt-1">
                  <MapPin size={12} className="text-white/60" /><Text className="text-white/60 text-xs">{selected.location}</Text>
                  <Star size={12} className="text-amber-400 fill-amber-400 ml-2" /><Text className="text-white text-xs">{selected.rating} ({selected.reviews})</Text>
                </View>
              </View>
            </View>
            <View className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
              <Text className="text-white/70 text-sm mb-4">{selected.desc}</Text>
              <View className="gap-3 mb-4">
                {[
                  { label: "Projets", value: selected.projects > 0 ? String(selected.projects) : "—" },
                  { label: "Expérience", value: selected.yearsExp > 0 ? `${selected.yearsExp} ans` : "—" },
                  { label: "Note", value: String(selected.rating) },
                ].map(({ label, value }) => (
                  <View key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <Text className="text-amber-400 font-bold text-lg">{value}</Text>
                    <Text className="text-white/50 text-xs">{label}</Text>
                  </View>
                ))}
              </View>
              {selected.skills.length > 0 && (
                <>
                  <Text className="text-white font-semibold text-sm mb-2">Compétences</Text>
                  <View className="flex flex-wrap gap-2 mb-4">
                    {selected.skills.map(s => (
                      <Text key={s} className="px-3 py-1.5 rounded-lg text-xs text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{s}</Text>
                    ))}
                  </View>
                </>
              )}
              <View className="flex gap-3">
                <Pressable onPress={() => handleContact(selected)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold"
                  style={{  }}>
                  <Phone size={16} /><Text>Contacter</Text></Pressable>
                <Pressable className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                  <MessageCircle size={16} className="text-white" /><Text className="text-white text-sm"><Text>Message</Text></Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </>

      {/* Booking modal */}
      <>
        {bookingPro && (
          <BookingModal provider={bookingPro} onClose={() => setBookingPro(null)} />
        )}
      </>
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AmenagementPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Authenticated>
        <AmenagementPageInner onBack={onBack} isAuthenticated={true} />
      </Authenticated>
      <Unauthenticated>
        <AmenagementPageInner onBack={onBack} isAuthenticated={false} />
      </Unauthenticated>
      <AuthLoading>
        <View className="h-full flex flex-col px-4 pt-16" style={{  }}>
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-3" />
          <Skeleton className="h-56 w-full rounded-2xl mb-3" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </View>
      </AuthLoading>
    </>
  );
}
