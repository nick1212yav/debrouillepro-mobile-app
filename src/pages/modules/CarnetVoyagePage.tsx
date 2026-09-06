import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { Pressable, View, Image, Text, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, BookOpen, Camera, MapPin, Heart, Share2,
  Plus, Globe, Award, Calendar, ChevronRight, Smile,
  Meh, Frown, Star, Map, BarChart2, Edit3, X, Check,
  Image as ImageIcon, Feather,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";

type Mood = "great" | "good" | "okay" | "bad";

const MOOD_CONFIG: Record<Mood, { icon: typeof Smile; label: string; color: string; bg: string }> = {
  great: { icon: Smile, label: "Super", color: "text-green-400", bg: "bg-green-500/20 border-green-500/40" },
  good:  { icon: Smile, label: "Bien",  color: "text-blue-400",  bg: "bg-blue-500/20 border-blue-500/40"  },
  okay:  { icon: Meh,   label: "Moyen", color: "text-yellow-400",bg: "bg-yellow-500/20 border-yellow-500/40"},
  bad:   { icon: Frown, label: "Dur",   color: "text-red-400",   bg: "bg-red-500/20 border-red-500/40"    },
};

type Props = { onBack: () => void };

function CarnetInner({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<"journal" | "memories" | "stats">("journal");
  const [selectedPlanId, setSelectedPlanId] = useState<Id<"travelPlans"> | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newMood, setNewMood] = useState<Mood>("good");
  const [newLocation, setNewLocation] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const entries = useQuery(api.travel.listJournalEntries, {});
  const plans = useQuery(api.travel.listMyTravelPlans, {});
  const stats = useQuery(api.travel.getTravelStats, {});
  const createEntry = useMutation(api.travel.createJournalEntry);

  const selectedEntry = entries?.find(e => e._id === selectedEntryId) ?? null;

  const handleAddEntry = async () => {
    if (!newTitle.trim()) return;
    if (!plans || plans.length === 0) {
      UIService.openToast("Créez d'abord un voyage dans le Planificateur", "error");
      return;
    }
    const planId = selectedPlanId ?? plans[0]._id;
    try {
      await createEntry({
        planId,
        title: newTitle,
        content: newContent,
        date: new Date().toISOString().split("T")[0],
        location: newLocation || undefined,
        mood: newMood,
        images: [],
      });
      UIService.openToast("Entrée ajoutée au carnet !", "success");
      setNewTitle(""); setNewContent(""); setNewMood("good"); setNewLocation("");
      setShowNewEntry(false);
    } catch {
      UIService.openToast("Erreur lors de l'enregistrement", "error");
    }
  };

  // Entry detail view
  if (selectedEntry) {
    const mood = (selectedEntry.mood as Mood) ?? "good";
    const MoodIcon = MOOD_CONFIG[mood].icon;
    return (
      <View className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
        {selectedEntry.images.length > 0 && (
          <View className="relative h-56 flex-shrink-0">
            <>
              <Image
                key={photoIndex}
                src={selectedEntry.images[photoIndex]}
                alt=""
                className="w-full h-full object-cover"
              />
            </>
            <View className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
            {selectedEntry.images.length > 1 && (
              <View className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {selectedEntry.images.map((_, i) => (
                  <Pressable key={i} onPress={() => setPhotoIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === photoIndex ? "bg-white w-4" : "bg-white/40"}`}
                  />
                ))}
              </View>
            )}
            <Pressable onPress={() => { setSelectedEntryId(null); setPhotoIndex(0); }} className="absolute top-12 left-4 p-2 rounded-xl bg-black/40">
              <ArrowLeft size={20} />
            </Pressable>
          </View>
        )}
        {selectedEntry.images.length === 0 && (
          <View className="flex items-center gap-3 px-4 pt-12 pb-2">
            <Pressable onPress={() => setSelectedEntryId(null)} className="p-2 rounded-xl bg-white/10">
              <ArrowLeft size={20} />
            </Pressable>
          </View>
        )}
        <View className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 pt-4">
          <View className="flex items-start justify-between gap-3">
            <View>
              <Text className="text-xl font-bold leading-tight">{selectedEntry.title}</Text>
              <View className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                {selectedEntry.location && <><MapPin size={12} /><Text>{selectedEntry.location}</Text><Text>·</Text></>}
                <Calendar size={12} />
                <Text>{new Date(selectedEntry.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</Text>
              </View>
            </View>
            <View className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium flex-shrink-0 ${MOOD_CONFIG[mood].bg} ${MOOD_CONFIG[mood].color}`}>
              <MoodIcon size={14} />
              {MOOD_CONFIG[mood].label}
            </View>
          </View>
          <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <Text className="text-sm text-gray-200 leading-relaxed">{selectedEntry.content}</Text>
          </View>
          <View className="flex gap-3">
            <Pressable className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium">
              <Share2 size={16} /> <Text>Partager</Text></Pressable>
            <Pressable className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-medium">
              <Edit3 size={16} /> <Text>Modifier</Text></Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <View className="flex items-center gap-3 px-4 pt-12 pb-3">
        <Pressable onPress={onBack} className="p-2 rounded-xl bg-white/10">
          <ArrowLeft size={20} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold">Carnet de Voyage</Text>
          <Text className="text-xs text-gray-400">{entries?.length ?? 0} entrées · {plans?.length ?? 0} voyages</Text>
        </View>
        <Pressable onPress={() => setShowNewEntry(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-sm font-semibold">
          <Plus size={16} /> <Text>Écrire</Text></Pressable>
      </View>

      <View className="flex bg-gray-900/60 mx-4 rounded-xl p-1 mb-3">
        {([
          { key: "journal", label: "Journal", icon: Feather },
          { key: "memories", label: "Voyages", icon: Map },
          { key: "stats", label: "Stats", icon: BarChart2 },
        ] as const).map(tab => (
          <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === tab.key ? "bg-white/15 text-white" : "text-gray-400 hover:text-gray-200"}`}>
            <tab.icon size={14} /> {tab.label}
          </Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-8">
        {activeTab === "journal" && (
          <View className="space-y-3">
            {!entries && <View className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}</View>}
            {entries?.length === 0 && (
              <View className="flex flex-col items-center justify-center py-16 gap-3">
                <BookOpen size={40} className="text-white/20" />
                <Text className="text-sm text-gray-400 text-center">Aucune entrée. Commencez à écrire !</Text>
                <Pressable onPress={() => setShowNewEntry(true)} className="px-4 py-2 bg-amber-500 rounded-xl text-sm font-semibold">
                  <Text>Première entrée</Text></Pressable>
              </View>
            )}
            {entries?.map((entry, i) => {
              const mood = (entry.mood as Mood) ?? "good";
              const MoodIcon = MOOD_CONFIG[mood].icon;
              return (
                <Pressable key={entry._id}
                  onPress={() => setSelectedEntryId(entry._id)}
                  className="w-full bg-white/5 rounded-2xl overflow-hidden border border-white/10 text-left">
                  {entry.images[0] && (
                    <View className="relative h-36">
                      <Image className="w-full h-full object-cover"  source={{ uri: entry.images[0] }} accessibilityLabel=""/>
                      <View className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <View className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                        <View>
                          {entry.location && <Text className="text-xs text-white/70 flex items-center gap-1"><MapPin size={10} />{entry.location}</Text>}
                          <Text className="text-sm font-bold leading-tight">{entry.title}</Text>
                        </View>
                        <View className={`p-1.5 rounded-lg border ${MOOD_CONFIG[mood].bg} ${MOOD_CONFIG[mood].color}`}><MoodIcon size={14} /></View>
                      </View>
                      {entry.images.length > 1 && (
                        <View className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-0.5 text-[10px] flex items-center gap-1">
                          <ImageIcon size={10} /> {entry.images.length}
                        </View>
                      )}
                    </View>
                  )}
                  <View className="p-3">
                    {!entry.images[0] && (
                      <View className="flex items-start justify-between mb-2">
                        <View>
                          {entry.location && <Text className="text-xs text-gray-400 flex items-center gap-1 mb-1"><MapPin size={10} />{entry.location}</Text>}
                          <Text className="text-sm font-bold">{entry.title}</Text>
                        </View>
                        <View className={`p-1.5 rounded-lg border ${MOOD_CONFIG[mood].bg} ${MOOD_CONFIG[mood].color}`}><MoodIcon size={14} /></View>
                      </View>
                    )}
                    <Text className="text-xs text-gray-400">{entry.content}</Text>
                    <Text className="text-xs text-gray-500 mt-2">{new Date(entry.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {activeTab === "memories" && (
          <View className="space-y-3">
            <View className="relative rounded-2xl overflow-hidden h-36 border border-white/10">
              <Image className="w-full h-full object-cover opacity-40"  source={{ uri: "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=800&q=80" }} accessibilityLabel="World map"/>
              <View className="absolute inset-0 flex flex-col items-center justify-center">
                <Globe size={28} className="text-cyan-400 mb-2" />
                <Text className="text-sm font-bold">{stats?.countries ?? 0} pays explorés</Text>
                <Text className="text-xs text-gray-400 mt-0.5">{stats?.days ?? 0} jours de voyage</Text>
              </View>
            </View>
            {!plans && <View className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}</View>}
            {plans?.length === 0 && (
              <View className="flex flex-col items-center py-12 gap-2 text-gray-400">
                <Map size={36} className="opacity-30" />
                <Text className="text-sm">Aucun voyage enregistré</Text>
              </View>
            )}
            {plans?.map((plan, i) => (
              <Pressable key={plan._id}
                onPress={() => setSelectedPlanId(plan._id)}
                className="relative rounded-2xl overflow-hidden group bg-white/5 border border-white/10">
                {plan.coverImage && <Image className="w-full h-40 object-cover"  source={{ uri: plan.coverImage }} accessibilityLabel={plan.destination}/>}
                {!plan.coverImage && <View className="w-full h-40 bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center"><Globe size={40} className="text-white/20" /></View>}
                <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <View className="absolute bottom-0 left-0 right-0 p-4">
                  <View className="flex items-end justify-between">
                    <View>
                      <Text className="text-lg font-bold">{plan.destination}</Text>
                      <Text className="text-xs text-white/70 mt-0.5">{plan.startDate} · {plan.entriesCount} entrées</Text>
                    </View>
                    <ChevronRight size={16} className="text-white/50" />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === "stats" && (
          <View className="space-y-4">
            <View className="gap-3">
              {[
                { label: "Pays visités", value: stats?.countries ?? 0, icon: Globe, color: "from-blue-500 to-cyan-500" },
                { label: "Jours de voyage", value: stats?.days ?? 0, icon: Calendar, color: "from-purple-500 to-pink-500" },
                { label: "Entrées journal", value: stats?.entries ?? 0, icon: Feather, color: "from-orange-500 to-yellow-500" },
                { label: "Voyages planifiés", value: stats?.plans ?? 0, icon: Camera, color: "from-green-500 to-teal-500" },
              ].map((stat, i) => (
                <View key={stat.label}
                  className={`bg-gradient-to-br ${stat.color} p-0.5 rounded-2xl`}>
                  <View className="bg-gray-950/80 rounded-2xl p-4 h-full flex flex-col">
                    <stat.icon size={20} className="mb-2 text-white/70" />
                    <Text className="text-2xl font-bold">{stat.value}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">{stat.label}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <Text className="text-sm font-semibold mb-3 flex items-center gap-2"><Award size={16} className="text-yellow-400" /> Destinations</Text>
              {plans?.length === 0 && <Text className="text-xs text-gray-400">Aucun voyage encore.</Text>}
              <View className="space-y-2">
                {plans?.slice(0, 6).map((plan) => (
                  <View key={plan._id} className="flex items-center gap-3">
                    <View className="flex-1">
                      <View className="flex items-center justify-between text-sm">
                        <Text className="font-medium truncate">{plan.destination}</Text>
                        <Text className="text-gray-400 text-xs">{plan.entriesCount} entrées</Text>
                      </View>
                      <View className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <View className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${Math.min(100, (plan.entriesCount / Math.max(1, (plans.map(p => p.entriesCount).reduce((a,b) => Math.max(a,b), 1)))) * 100)}%` }} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* New entry modal */}
      <>
        {showNewEntry && (
          <Pressable
            className="absolute inset-0 bg-black/70 flex items-end z-50"
            onPress={() => setShowNewEntry(false)}>
            <Pressable
              onPress={e => e.stopPropagation()}
              className="w-full bg-gray-900 rounded-t-3xl p-6 pb-10 space-y-4 max-h-[85vh] overflow-y-auto">
              <View className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2" />
              <View className="flex items-center justify-between">
                <Text className="text-lg font-bold">Nouvelle entrée</Text>
                <Pressable onPress={() => setShowNewEntry(false)} className="p-2 rounded-xl bg-white/10"><X size={16} /></Pressable>
              </View>

              {plans && plans.length > 1 && (
                <View>
                  <Text className="text-xs text-gray-400 mb-1">Voyage</Text>
                  <Picker
                    onValueChange={val => setSelectedPlanId(val as Id<"travelPlans">)}
                    className="w-full bg-white/10 rounded-xl px-4 py-3 text-white outline-none text-sm" selectedValue={selectedPlanId ?? plans[0]._id}>
                    {plans.map(p => <Picker.Item label={`${p.destination}`} value={p._id} />)}
                  </Picker>
                </View>
              )}

              <TextInput value={newTitle} onChangeText={text => setNewTitle(text)}
                className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none text-sm"
                placeholder="Titre (ex: Coucher de soleil à Santorini)" />
              <TextInput value={newLocation} onChangeText={text => setNewLocation(text)}
                className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none text-sm"
                placeholder="Lieu (ex: Tokyo, Japon)" />
              <TextInput value={newContent} onChangeText={text => setNewContent(text)}
                className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none text-sm"
                placeholder="Raconte ta journée, tes émotions, tes découvertes..."  multiline textAlignVertical="top"/>
              <View>
                <Text className="text-xs text-gray-400 mb-2">Humeur du jour</Text>
                <View className="gap-2">
                  {(["great", "good", "okay", "bad"] as Mood[]).map(mood => {
                    const cfg = MOOD_CONFIG[mood];
                    const sel = newMood === mood;
                    return (
                      <Pressable key={mood} onPress={() => setNewMood(mood)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs transition-all cursor-pointer ${sel ? `${cfg.bg} ${cfg.color}` : "bg-white/5 border-white/10 text-gray-400"}`}>
                        <cfg.icon size={18} />{cfg.label}{sel && <Check size={12} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Pressable onPress={handleAddEntry} disabled={!newTitle.trim()}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                <Text>Enregistrer dans le carnet</Text></Pressable>
            </Pressable>
          </Pressable>
        )}
      </>
    </View>
  );
}

export default function CarnetVoyagePage({ onBack }: Props) {
  return (
    <>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center bg-gray-950 text-white gap-4 px-6">
          <BookOpen size={40} className="text-white/20" />
          <Text className="text-center text-gray-400 text-sm">Connectez-vous pour accéder à votre carnet de voyage</Text>
          <Pressable onPress={onBack} className="flex items-center gap-2 text-sm text-gray-400"><ArrowLeft size={16} /> Retour</Pressable>
        </View>
      </Unauthenticated>
      <AuthLoading>
        <View className="h-full flex flex-col bg-gray-950 px-4 pt-12 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </View>
      </AuthLoading>
      <Authenticated>
        <CarnetInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
