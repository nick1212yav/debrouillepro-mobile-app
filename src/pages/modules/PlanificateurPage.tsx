import { View, Pressable, Text, Image, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Plus, Calendar, MapPin, Clock, Utensils, Bed,
  Camera, CheckCircle2, Circle,
  Plane, Train, Car, Sparkles, Share2,
  Star, Navigation,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";

type TransportMode = "plane" | "train" | "car" | "other";

const AI_SUGGESTIONS = [
  { icon: "🍜", title: "Ramen Fuunji", type: "restaurant", rating: 4.8, note: "Meilleur ramen de Shinjuku selon les locaux" },
  { icon: "🏯", title: "Château d'Osaka", type: "activity", rating: 4.6, note: "Excursion d'une journée idéale" },
  { icon: "🎭", title: "Spectacle Kabuki", type: "activity", rating: 4.9, note: "Expérience culturelle unique, réserver 2 semaines avant" },
  { icon: "🛁", title: "Onsen Hakone", type: "activity", rating: 4.7, note: "Sources chaudes avec vue sur le Mont Fuji" },
];

const CHECKLIST_ITEMS_DEFAULT = [
  { id: "c1", label: "Passeport / Visa", done: false },
  { id: "c2", label: "Billet d'avion", done: false },
  { id: "c3", label: "Assurance voyage", done: false },
  { id: "c4", label: "Réservation hôtel", done: false },
  { id: "c5", label: "Change de devises", done: false },
  { id: "c6", label: "Adaptateur électrique", done: false },
  { id: "c7", label: "Téléchargement cartes hors-ligne", done: false },
  { id: "c8", label: "Vaccins requis", done: false },
];

type Props = { onBack: () => void };

function PlanificateurInner({ onBack }: Props) {
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"itinerary" | "checklist" | "ai">("itinerary");
  const [checklist, setChecklist] = useState(CHECKLIST_ITEMS_DEFAULT);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [newDest, setNewDest] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newTravelers, setNewTravelers] = useState("2");
  const [newTransport, setNewTransport] = useState<TransportMode>("plane");
  const [shareToast, setShareToast] = useState(false);

  const trips = useQuery(api.travel.listMyTravelPlans, {});
  const createTrip = useMutation(api.travel.createTravelPlan);

  const selectedTrip = trips?.find(t => t._id === selectedTripId) ?? null;

  const handleCreateTrip = async () => {
    if (!newDest.trim() || !newStart || !newEnd) return;
    try {
      await createTrip({
        title: newDest,
        destination: newDest,
        startDate: newStart,
        endDate: newEnd,
        travelers: parseInt(newTravelers) || 1,
      });
      toast.success("Voyage créé !");
      setShowNewTrip(false);
      setNewDest(""); setNewStart(""); setNewEnd(""); setNewTravelers("2");
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const doneCount = checklist.filter(c => c.done).length;
  const progressPct = Math.round((doneCount / checklist.length) * 100);

  if (!selectedTrip) {
    return (
      <View className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden"><View className="flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={onBack} className="p-2 rounded-xl bg-white/10 transition-colors"><ArrowLeft size={20} /></Pressable><View className="flex-1"><Text className="text-xl font-bold">Planificateur</Text><Text className="text-xs text-gray-400">{trips?.length ?? 0}voyage{(trips?.length ?? 0) > 1 ? "s" : ""}planifié{(trips?.length ?? 0) > 1 ? "s" : ""}</Text></View><Pressable onPress={() => setShowNewTrip(true)} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-sm font-semibold transition-opacity"><Plus size={16} /><Text>Nouveau</Text></Pressable></View><View className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">{!trips && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}{trips?.map((trip, i) => (
            <View key={trip._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onPress={() => setSelectedTripId(trip._id)} className="relative rounded-2xl overflow-hidden group">
              {trip.coverImage
                ? <Image className="w-full h-44 object-cover transition-transform duration-500" source={{ uri: trip.coverImage }} accessibilityLabel={trip.destination} />
                : <View className="w-full h-44 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 flex items-center justify-center"><MapPin size={40} className="text-white/20" /></View>
              }
              <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <View className="absolute bottom-0 left-0 right-0 p-4"><View className="flex items-end justify-between"><View><Text className="text-2xl font-bold">{trip.destination}</Text><View className="flex items-center gap-3 mt-1 text-xs text-white/80"><Text className="flex items-center gap-1"><Calendar size={12} />{new Date(trip.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}– {new Date(trip.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</Text></View></View><View className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 text-center"><Text className="text-lg font-bold">{trip.travelers}</Text><Text className="text-xs text-white/70">voyageurs</Text></View></View></View>
              <View className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-full px-2 py-1 text-xs flex items-center gap-1"><CheckCircle2 size={12} className="text-green-400" />{trip.entriesCount}<Text>entrées</Text></View>
            </View>
          ))}<Pressable initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} onPress={() => setShowNewTrip(true)} className="w-full rounded-2xl border-2 border-dashed border-white/20 p-8 flex flex-col items-center gap-3 text-white/50 transition-all"><Plus size={28} /><Text className="text-sm font-medium">Planifier un nouveau voyage</Text></Pressable></View><View>{showNewTrip && (
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-end z-50" onPress={() => setShowNewTrip(false)}>
              <View initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} onPress={e => e.stopPropagation()} className="w-full bg-gray-900 rounded-t-3xl p-6 pb-10 space-y-4">
                <View className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2" />
                <Text className="text-lg font-bold text-center">Nouveau Voyage</Text>
                <TextInput value={newDest} onChangeText={value => setNewDest(value)} className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none text-sm" placeholder="Destination (ex: Tokyo, Japon)" />
                <View className="gap-3"><View><Text className="text-xs text-gray-400 mb-1 block">Départ</Text><TextInput value={newStart} onChangeText={value => setNewStart(value)} className="w-full bg-white/10 rounded-xl px-4 py-3 text-white outline-none text-sm [color-scheme:dark]" /></View><View><Text className="text-xs text-gray-400 mb-1 block">Retour</Text><TextInput value={newEnd} onChangeText={value => setNewEnd(value)} className="w-full bg-white/10 rounded-xl px-4 py-3 text-white outline-none text-sm [color-scheme:dark]" /></View></View>
                <TextInput value={newTravelers} onChangeText={value => setNewTravelers(value)} className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none text-sm" placeholder="Nombre de voyageurs" keyboardType="numeric" />
                <View><Text className="text-xs text-gray-400 mb-2 block">Transport principal</Text><View className="gap-2">{(["plane", "train", "car", "other"] as TransportMode[]).map(m => (
                      <Pressable key={m} onPress={() => setNewTransport(m)} className={`rounded-xl py-3 flex flex-col items-center gap-1 text-xs cursor-pointer transition-colors ${newTransport === m ? "bg-blue-500/30 border border-blue-500/50 text-blue-300" : "bg-white/10 hover:bg-white/20"}`}>{m === "plane" && <Plane size={18} />}{m === "train" && <Train size={18} />}{m === "car" && <Car size={18} />}{m === "other" && <Navigation size={18} />}<Text>{m === "plane" ? "Avion" : m === "train" ? "Train" : m === "car" ? "Voiture" : "Autre"}</Text></Pressable>
                    ))}</View></View>
                <Pressable onPress={handleCreateTrip} disabled={!newDest.trim() || !newStart || !newEnd} className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold transition-opacity disabled:opacity-40"><Text>Créer l'itinéraire</Text></Pressable>
              </View>
            </View>
          )}</View></View>
    );
  }

  return (
    <View className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden"><View className="relative h-48 flex-shrink-0">{selectedTrip.coverImage
          ? <Image className="w-full h-full object-cover" source={{ uri: selectedTrip.coverImage }} accessibilityLabel={selectedTrip.destination} />
          : <View className="w-full h-full bg-gradient-to-br from-blue-900/60 to-cyan-900/60 flex items-center justify-center"><MapPin size={48} className="text-white/20" /></View>}<View className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" /><Pressable onPress={() => setSelectedTripId(null)} className="absolute top-12 left-4 p-2 rounded-xl bg-black/40 backdrop-blur-md transition-colors"><ArrowLeft size={20} /></Pressable><Pressable onPress={() => { setShareToast(true); setTimeout(() => setShareToast(false), 2500); }} className="absolute top-12 right-4 p-2 rounded-xl bg-black/40 backdrop-blur-md transition-colors"><Share2 size={18} /></Pressable><View className="absolute bottom-3 left-4 right-4 flex items-end justify-between"><View><Text className="text-2xl font-bold">{selectedTrip.destination}</Text><Text className="text-xs text-white/70 mt-0.5">{new Date(selectedTrip.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}– {new Date(selectedTrip.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}{" · "}{selectedTrip.travelers}voyageurs
            </Text></View><View className="text-right"><Text className="text-sm font-bold text-green-400">{selectedTrip.entriesCount}</Text><Text className="text-xs text-white/60">entrées</Text></View></View></View><View className="flex bg-gray-900/80 backdrop-blur-md border-b border-white/10">{([
          { key: "itinerary", label: "Détails", icon: Calendar },
          { key: "checklist", label: "Checklist", icon: CheckCircle2 },
          { key: "ai", label: "Suggestions", icon: Sparkles },
        ] as const).map(tab => (
          <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors cursor-pointer ${activeTab === tab.key ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"}`}><tab.icon size={16} />{tab.label}</Pressable>
        ))}</View><View className="flex-1 overflow-y-auto">{activeTab === "itinerary" && (
          <View className="p-4 pb-8 space-y-4"><View className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3"><Text className="text-sm font-semibold text-white/70">Informations du voyage</Text><View className="gap-3">{[
                  { label: "Destination", value: selectedTrip.destination, icon: MapPin },
                  { label: "Départ", value: new Date(selectedTrip.startDate).toLocaleDateString("fr-FR"), icon: Calendar },
                  { label: "Retour", value: new Date(selectedTrip.endDate).toLocaleDateString("fr-FR"), icon: Calendar },
                  { label: "Voyageurs", value: String(selectedTrip.travelers), icon: Camera },
                  { label: "Entrées journal", value: String(selectedTrip.entriesCount), icon: Clock },
                  { label: "Statut", value: selectedTrip.status === "draft" ? "Brouillon" : selectedTrip.status === "confirmed" ? "Confirmé" : "Terminé", icon: CheckCircle2 },
                ].map(item => (
                  <View key={item.label} className="bg-white/5 rounded-xl p-3"><View className="flex items-center gap-2 mb-1"><item.icon size={12} className="text-white/40" /><Text className="text-xs text-gray-400">{item.label}</Text></View><Text className="text-sm font-semibold">{item.value}</Text></View>
                ))}</View>{selectedTrip.totalBudget && (
                <View className="bg-green-500/10 rounded-xl p-3 border border-green-500/20"><Text className="text-xs text-green-400 mb-1">Budget total</Text><Text className="text-lg font-bold text-green-300">{selectedTrip.totalBudget.toLocaleString("fr-FR")}{selectedTrip.currency ?? "EUR"}</Text><Text className="text-xs text-white/40">Dépensé : {selectedTrip.expensesTotal.toLocaleString("fr-FR")}{selectedTrip.currency ?? "EUR"}</Text></View>
              )}</View><View className="bg-white/5 rounded-2xl p-4 border border-white/10"><Text className="text-sm text-gray-400 text-center">Utilisez le Carnet de Voyage pour ajouter des entrées à ce voyage</Text></View></View>
        )}{activeTab === "checklist" && (
          <View className="p-4 pb-8 space-y-4"><View className="bg-white/5 rounded-2xl p-4 border border-white/10"><View className="flex items-center justify-between mb-3"><Text className="font-semibold text-sm">Préparation voyage</Text><Text className="text-blue-400 font-bold">{progressPct}%</Text></View><View className="h-2 bg-white/10 rounded-full overflow-hidden"><View className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8, ease: "easeOut" as const }} /></View><Text className="text-xs text-gray-400 mt-2">{doneCount}/{checklist.length}éléments complétés</Text></View><View className="space-y-2">{checklist.map((item, i) => (
                <Pressable key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onPress={() => toggleCheck(item.id)} className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${item.done ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                  {item.done ? <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" /> : <Circle size={20} className="text-gray-500 flex-shrink-0" />}
                  <Text className={`text-sm ${item.done ? "line-through text-gray-400" : "text-white"}`}>{item.label}</Text>
                </Pressable>
              ))}</View></View>
        )}{activeTab === "ai" && (
          <View className="p-4 pb-8 space-y-4"><View className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl p-4"><View className="flex items-center gap-3"><View className="p-2 bg-purple-500/20 rounded-xl"><Sparkles size={18} className="text-purple-400" /></View><View><Text className="font-semibold text-sm">Suggestions pour {selectedTrip.destination}</Text><Text className="text-xs text-gray-400">Basé sur votre itinéraire et les tendances</Text></View></View></View>{AI_SUGGESTIONS.map((sug, i) => (
              <View key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <View className="flex items-start gap-3"><Text className="text-2xl flex-shrink-0">{sug.icon}</Text><View className="flex-1"><View className="flex items-center justify-between"><Text className="font-semibold text-sm">{sug.title}</Text><View className="flex items-center gap-1 text-yellow-400"><Star size={12} fill="currentColor" /><Text className="text-xs">{sug.rating}</Text></View></View><Text className="text-xs text-gray-400 mt-0.5 capitalize">{sug.type}</Text><Text className="text-xs text-gray-300 mt-2">{sug.note}</Text></View></View>
                <View className="flex gap-2 mt-3">
                  <Pressable onPress={() => toast.success(`${sug.title} ajouté à vos notes`)} className="flex-1 py-2 bg-white/10 rounded-xl text-xs transition-colors flex items-center justify-center gap-1">
                    <Plus size={12} /> Ajouter
                  </Pressable>
                  <Pressable className="flex-1 py-2 bg-white/10 rounded-xl text-xs transition-colors">En savoir plus</Pressable>
                </View>
              </View>
            ))}</View>
        )}</View><View>{shareToast && (
          <View initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-white/20 rounded-xl px-5 py-3 text-sm font-medium shadow-xl">
            Lien de partage copié ✓
          </View>
        )}</View></View>
  );
}

export default function PlanificateurPage({ onBack }: Props) {
  return (
    <>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center bg-gray-950 text-white gap-4 px-6">
          <Calendar size={40} className="text-white/20" />
          <Text className="text-center text-gray-400 text-sm">Connectez-vous pour planifier vos voyages</Text>
          <Pressable onPress={onBack} className="flex items-center gap-2 text-sm text-gray-400"><ArrowLeft size={16} /> Retour</Pressable>
        </View>
      </Unauthenticated>
      <AuthLoading>
        <View className="h-full flex flex-col bg-gray-950 px-4 pt-12 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
        </View>
      </AuthLoading>
      <Authenticated>
        <PlanificateurInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
