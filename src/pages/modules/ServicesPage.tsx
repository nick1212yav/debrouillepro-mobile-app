import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import {
  ArrowLeft, Wrench, Search, Star, MapPin, Phone, MessageCircle,
  Clock, X, CheckCircle, ChevronRight, Zap, Scissors, ShoppingBag,
  Heart, Truck, Book, Camera, Music, Smile, Filter, Plus, Shield
} from "lucide-react-native";

type ServiceCat = "Tout" | "Dépannage" | "Beauté" | "Livraison" | "Éducation" | "Photo" | "Bien-être" | "Événementiel";

const CATS: ServiceCat[] = ["Tout", "Dépannage", "Beauté", "Livraison", "Éducation", "Photo", "Bien-être"];
const CAT_ICONS: Record<ServiceCat, typeof Wrench> = {
  "Tout": Wrench, "Dépannage": Zap, "Beauté": Scissors, "Livraison": Truck,
  "Éducation": Book, "Photo": Camera, "Bien-être": Heart, "Événementiel": Music,
};

type Provider = Doc<"serviceProviders">;

export default function ServicesPage({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<ServiceCat>("Tout");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Provider | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seed data on first mount
  const seedData = useMutation(api.serviceProviders.seed);
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      seedData().catch(() => {
        // Seed might fail if already seeded or unauthenticated — safe to ignore
      });
    }
  }, [seedData]);

  // Query providers from Convex with category filter
  const categoryArg = filter === "Tout" ? undefined : filter;
  const providers = useQuery(api.serviceProviders.list, { category: categoryArg });

  const bookProvider = useMutation(api.serviceProviders.book);

  // Client-side search + urgent filter
  const filtered = providers?.filter(s =>
    (!urgentOnly || s.urgent) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  const handleBook = async () => {
    if (!selected) return;
    if (!bookingMessage.trim()) {
      UIService.openToast("Veuillez écrire un message", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await bookProvider({
        providerId: selected._id,
        message: bookingMessage.trim(),
        scheduledAt: bookingDate || undefined,
      });
      UIService.openToast("Réservation envoyée !", "success");
      setBookingModal(false);
      setBookingMessage("");
      setBookingDate("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la réservation";
      UIService.openToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="h-full flex flex-col" style={{  }}>
      <View className="flex-shrink-0 px-4 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Services à la Personne</Text>
            <Text className="text-xs text-white/50">
              {filtered !== undefined ? `${filtered.length} prestataires disponibles` : "Chargement..."}
            </Text>
          </View>
          <Pressable onPress={() => setShowRequest(true)} className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{  }}>
            <Plus size={18} className="text-white" />
          </Pressable>
        </View>

        <View className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
          <Search size={16} className="text-white/40" />
          <TextInput value={search} onChangeText={text => setSearch(text)} placeholder="Service, spécialité..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
          <Pressable onPress={() => setUrgentOnly(u => !u)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
            style={{ backgroundColor: urgentOnly ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)" }}>
            <Zap size={12} /><Text>Urgent</Text></Pressable>
        </View>

        <View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATS.map(c => {
            const Icon = CAT_ICONS[c];
            return (
              <Pressable key={c} onPress={() => setFilter(c)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: filter === c ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.07)" }}>
                <Icon size={12} />{c}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6">
        <View className="space-y-4">
          {/* Loading skeletons */}
          {filtered === undefined && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <Skeleton className="w-full h-36 rounded-none" />
                  <View className="p-3 space-y-2">
                    <View className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <View className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </View>
                    </View>
                    <Skeleton className="h-3 w-2/3" />
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Provider cards */}
          {filtered?.map((svc, i) => (
            <Pressable key={svc._id}
              className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              onPress={() => setSelected(svc)}>
              <View className="relative">
                {svc.imageUrl ? (
                  <Image className="w-full h-36 object-cover"  source={{ uri: svc.imageUrl }} accessibilityLabel={svc.name}/>
                ) : (
                  <View className="w-full h-36 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <Wrench size={40} className="text-white/20" />
                  </View>
                )}
                <View className="absolute inset-0" style={{  }} />
                {svc.urgent && (
                  <View className="absolute top-3 left-3">
                    <Text className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: "rgba(239,68,68,0.8)" }}>
                      <Zap size={11} />24h/24
                    </Text>
                  </View>
                )}
                {!svc.available && (
                  <View className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <Text className="text-white font-bold bg-red-500/80 px-4 py-1 rounded-full">Indisponible</Text>
                  </View>
                )}
              </View>
              <View className="p-3">
                <View className="flex items-start gap-3">
                  <View className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{  }}>
                    {svc.name.slice(0, 2).toUpperCase()}
                  </View>
                  <View className="flex-1 min-w-0">
                    <View className="flex items-center gap-2">
                      <Text className="text-white font-semibold text-sm truncate">{svc.name}</Text>
                      {svc.verified && <Shield size={13} className="text-green-400 flex-shrink-0" />}
                    </View>
                    <Text className="text-orange-400/80 text-xs truncate">{svc.specialty}</Text>
                    <View className="flex items-center gap-1 mt-0.5"><MapPin size={11} className="text-white/40" /><Text className="text-white/50 text-xs truncate">{svc.location}</Text></View>
                  </View>
                  <View className="flex items-center gap-1 flex-shrink-0"><Star size={12} className="text-amber-400 fill-amber-400" /><Text className="text-white text-xs font-semibold">{svc.rating}</Text></View>
                </View>
                <View className="flex items-center gap-3 mt-2">
                  <Text className="text-orange-400 text-sm font-semibold">{svc.price}</Text>
                  <View className="flex items-center gap-1"><Clock size={11} className="text-white/30" /><Text className="text-white/50 text-xs">{svc.responseTime}</Text></View>
                  <Text className="text-white/30 text-xs ml-auto">{svc.reviewCount} avis</Text>
                </View>
              </View>
            </Pressable>
          ))}

          {filtered !== undefined && filtered.length === 0 && (
            <View className="flex flex-col items-center py-16 gap-3">
              <Smile size={48} className="text-white/20" />
              <Text className="text-white/40 text-sm">Aucun service trouvé</Text>
              <Text className="text-white/25 text-xs">Essayez un autre filtre</Text>
            </View>
          )}
        </View>
      </View>

      {/* Detail modal */}
      <>
        {selected && (
          <View className="absolute inset-0 z-50 flex flex-col"
            style={{  }}>
            <View className="relative flex-shrink-0">
              {selected.imageUrl ? (
                <Image className="w-full h-52 object-cover"  source={{ uri: selected.imageUrl }} accessibilityLabel={selected.name}/>
              ) : (
                <View className="w-full h-52 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                  <Wrench size={56} className="text-white/20" />
                </View>
              )}
              <View className="absolute inset-0" style={{  }} />
              <Pressable onPress={() => setSelected(null)} className="absolute top-12 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <X size={20} className="text-white" />
              </Pressable>
              <View className="absolute bottom-4 left-4 right-4">
                <View className="flex items-center gap-2 mb-1">
                  {selected.urgent && <Text className="flex items-center gap-1 text-xs text-red-300 px-2 py-0.5 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.3)" }}><Zap size={11} />Urgence 24h/24</Text>}
                  {selected.verified && <Text className="flex items-center gap-1 text-xs text-green-300"><CheckCircle size={11} />Vérifié</Text>}
                </View>
                <Text className="text-white text-xl font-bold">{selected.name}</Text>
                <Text className="text-orange-400 text-sm">{selected.specialty}</Text>
              </View>
            </View>
            <View className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
              <Text className="text-white/70 text-sm mb-4">{selected.description}</Text>
              <View className="gap-3 mb-4">
                {[
                  { label: "Prix", value: selected.price },
                  { label: "Réponse", value: selected.responseTime },
                  { label: "Note", value: `${selected.rating}/5` },
                ].map(({ label, value }) => (
                  <View key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <Text className="text-orange-400 font-bold text-sm">{value}</Text>
                    <Text className="text-white/50 text-xs">{label}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-white font-semibold text-sm mb-2">Compétences</Text>
              <View className="flex flex-wrap gap-2 mb-4">
                {selected.skills.map(s => (
                  <Text key={s} className="px-3 py-1.5 rounded-lg text-xs text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{s}</Text>
                ))}
              </View>
              <View className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <MapPin size={16} className="text-orange-400" />
                <Text className="text-white/70 text-sm">{selected.location}</Text>
                <View className="flex items-center gap-1 ml-auto"><Star size={13} className="text-amber-400 fill-amber-400" /><Text className="text-white font-semibold text-sm">{selected.rating}</Text><Text className="text-white/40 text-xs">({selected.reviewCount})</Text></View>
              </View>
              <View className="flex gap-3">
                <Authenticated>
                  <Pressable
                    onPress={() => setBookingModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold"
                    style={{  }}>
                    <Phone size={16} /><Text>Réserver</Text></Pressable>
                  <Pressable
                    onPress={() => setBookingModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                    <MessageCircle size={16} className="text-white" /><Text className="text-white text-sm"><Text>Message</Text></Text>
                  </Pressable>
                </Authenticated>
                <Unauthenticated>
                  <View className="flex-1 flex flex-col items-center gap-2">
                    <Text className="text-white/50 text-xs text-center"><Text>Connectez-vous pour réserver</Text></Text>
                    <SignInButton />
                  </View>
                </Unauthenticated>
              </View>
            </View>
          </View>
        )}
      </>

      {/* Booking modal */}
      <>
        {bookingModal && selected && (
          <Pressable className="absolute inset-0 z-[60] flex flex-col justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={() => setBookingModal(false)}>
            <Pressable className="rounded-t-3xl p-6"
              style={{ backgroundColor: "#0D1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} onPress={e => e.stopPropagation()}>
              <View className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
              <Text className="text-white font-bold text-lg mb-1">Réserver {selected.name}</Text>
              <Text className="text-white/50 text-xs mb-4">{selected.specialty}</Text>

              <Text className="text-white/60 text-xs mb-1 block">Votre message</Text>
              <TextInput
                value={bookingMessage}
                onChangeText={text => setBookingMessage(text)}
                placeholder="Décrivez votre besoin..."
                className="w-full rounded-xl p-3 text-sm text-white bg-transparent outline-none mb-3"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               
               multiline textAlignVertical="top"/>

              <Text className="text-white/60 text-xs mb-1 block">Date souhaitée (optionnel)</Text>
              <TextInput
               
                value={bookingDate}
                onChangeText={text => setBookingDate(text)}
                className="w-full rounded-xl p-3 text-sm text-white bg-transparent outline-none mb-4"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
              />

              <Pressable
                onPress={handleBook}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50"
                style={{  }}>
                {isSubmitting ? "Envoi..." : "Confirmer la réservation"}
              </Pressable>
              <Pressable onPress={() => setBookingModal(false)} className="w-full py-3 mt-2 rounded-xl text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <Text>Annuler</Text></Pressable>
            </Pressable>
          </Pressable>
        )}
      </>

      {/* Request category sheet */}
      <>
        {showRequest && (
          <Pressable className="absolute inset-0 z-50 flex flex-col justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={() => setShowRequest(false)}>
            <Pressable className="rounded-t-3xl p-6"
              style={{ backgroundColor: "#0D1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} onPress={e => e.stopPropagation()}>
              <View className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
              <Text className="text-white font-bold text-lg mb-4">Demander un service</Text>
              <View className="gap-3 mb-5">
                {CATS.filter(c => c !== "Tout").map(c => {
                  const Icon = CAT_ICONS[c];
                  return (
                    <Pressable key={c} onPress={() => { setFilter(c); setShowRequest(false); }} className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: "rgba(249,115,22,0.1)", borderWidth: 1, borderColor: "rgba(249,115,22,0.2)", borderStyle: "solid" }}>
                      <Icon size={20} className="text-orange-400" />
                      <Text className="text-white/70 text-xs text-center">{c}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => setShowRequest(false)} className="w-full py-3.5 rounded-xl text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><Text>Annuler</Text></Pressable>
            </Pressable>
          </Pressable>
        )}
      </>
    </View>
  );
}
