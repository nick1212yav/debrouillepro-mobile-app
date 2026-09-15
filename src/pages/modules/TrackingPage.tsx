import { View, Pressable, Text, TextInput } from "react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { ArrowLeft, MapPin, Package, Car, Smartphone, Clock, CheckCircle, AlertTriangle, Plus, Search, Navigation, Trash2 } from "lucide-react-native";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";

const ICON_MAP: Record<string, typeof Package> = {
  colis: Package,
  vehicule: Car,
  appareil: Smartphone,
  autre: Navigation,
};

const COLOR_MAP: Record<string, string> = {
  colis: "#F97316",
  vehicule: "#6366F1",
  appareil: "#10B981",
  autre: "#8B5CF6",
};

interface TrackingPageProps { onBack: () => void; }

export default function TrackingPage({ onBack }: TrackingPageProps) {
  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}><AuthLoading><View className="flex items-center gap-3 px-4 pt-12 pb-3"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable><Skeleton className="h-8 w-48" /></View><View className="px-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</View></AuthLoading><Unauthenticated><View className="flex items-center gap-3 px-4 pt-12 pb-3"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable><Text className="text-white font-bold">Tracking</Text></View><View className="flex-1 flex flex-col items-center justify-center gap-4 px-6"><Navigation size={40} className="text-orange-400" /><Text className="text-white/60 text-sm text-center">Connectez-vous pour suivre vos colis et objets</Text><SignInButton /></View></Unauthenticated><Authenticated><TrackingInner onBack={onBack} /></Authenticated></View>
  );
}

function TrackingInner({ onBack }: TrackingPageProps) {
  const items = useQuery(api.tracking.listMyTrackedItems, {});
  const addItem = useMutation(api.tracking.addTrackingItem);
  const deleteItem = useMutation(api.tracking.deleteTrackingItem);

  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = (items ?? []).filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.trackingId.toLowerCase().includes(search.toLowerCase())
  );

  const current = (items ?? []).find(t => t._id === selected);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setAdding(true);
      await addItem({
        name: newName.trim(),
        type: "colis",
        trackingId: newId.trim() || `TRK-${Date.now()}`,
        status: "En attente",
        progress: 0,
      });
      setNewName("");
      setNewId("");
      toast.success("Suivi ajouté !");
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: Id<"trackingItems">) => {
    try {
      await deleteItem({ itemId: id });
      toast.success("Suivi supprimé");
      if (selected === id) setSelected(null);
    } catch {
      toast.error("Erreur");
    }
  };

  if (selected && current) {
    const Icon = ICON_MAP[current.type] ?? Package;
    const color = COLOR_MAP[current.type] ?? "#6366F1";
    return (
      <View className="h-full flex flex-col overflow-hidden"><View className="flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={() => setSelected(null)} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex-1"><Text className="text-white font-bold text-base truncate">{current.name}</Text><Text className="text-gray-400 text-xs">{current.trackingId}</Text></View><View className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: `${color}20`, borderStyle: "solid" }}><View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /><Text className="text-xs font-bold" style={{ color }}>{current.status}</Text></View></View><View className="mx-4 p-4 rounded-2xl mb-4" style={{ backgroundColor: `${color}10`, borderStyle: "solid" }}><View className="flex items-center gap-3 mb-3"><View className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}><Icon size={24} color={color} /></View><View><Text className="text-white font-bold">{current.status}</Text>{current.location && (
                <View className="flex items-center gap-1"><Navigation size={12} color="#9CA3AF" /><Text className="text-gray-400 text-sm">{current.location}</Text></View>
              )}</View></View><View className="w-full h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><View className="h-full rounded-full" style={{ width: `${current.progress}%`, backgroundColor: color }} /></View><View className="flex justify-between mt-1"><Text className="text-gray-400 text-xs">Expédition</Text><Text className="font-bold text-xs" style={{ color }}>{current.progress}%</Text><Text className="text-gray-400 text-xs">Livraison</Text></View></View>{current.notes && (
          <View className="mx-4 p-3 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-white/60 text-sm">{current.notes}</Text></View>
        )}<View className="px-4"><Pressable onPress={() => void handleDelete(current._id as Id<"trackingItems">)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.15)", borderStyle: "solid" }}><Trash2 size={14} /><Text>Supprimer ce suivi</Text></Pressable></View></View>
    );
  }

  return (
    <>
      <View className="flex items-center gap-3 px-4 pt-12 pb-3"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex-1"><Text className="text-white font-bold text-lg">Tracking</Text><Text className="text-gray-400 text-xs">Localiser · Suivre · Historiser</Text></View><View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,.15)" }}><Navigation size={16} color="#F97316" /></View></View>

      <View className="flex items-center gap-2 mx-4 mb-3 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}><Search size={14} color="#9CA3AF" /><TextInput value={search} onChangeText={value => setSearch(value)} placeholder="Rechercher..." className="flex-1 bg-transparent text-white text-sm outline-none" /></View>

      <View className="mx-4 mb-3 flex gap-2"><TextInput value={newName} onChangeText={value => setNewName(value)} placeholder="Nom du colis / objet..." className="flex-1 px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderStyle: "solid" }} /><TextInput value={newId} onChangeText={value => setNewId(value)} placeholder="N° de suivi" className="w-32 px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderStyle: "solid" }} /><Pressable onPress={() => void handleAdd()} disabled={adding || !newName.trim()} className="px-3 py-2 rounded-xl font-bold text-sm disabled:opacity-50" style={{ backgroundColor: "#F97316" }}><Plus size={16} /></Pressable></View>

      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-3" style={{  }}>{items === undefined ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-12 gap-3"><Package size={36} className="text-white/20" /><Text className="text-white/40 text-sm">Aucun suivi enregistré</Text><Text className="text-white/25 text-xs text-center">Ajoutez un colis ou objet à suivre</Text></View>
        ) : (
          filtered.map((item, i) => {
            const Icon = ICON_MAP[item.type] ?? Package;
            const color = COLOR_MAP[item.type] ?? "#6366F1";
            return (
              <View key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }} onPress={() => setSelected(item._id)} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
                <View className="flex items-center gap-3 mb-2"><View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}><Icon size={18} color={color} /></View><View className="flex-1"><Text className="text-white font-semibold text-sm truncate">{item.name}</Text><View className="flex items-center gap-1"><Clock size={10} color="#9CA3AF" /><Text className="text-gray-400 text-xs">{item.trackingId}</Text></View></View><Text className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${color}20`, color }}>{item.status}</Text></View>
                {item.location && (
                  <View className="flex items-center gap-1 mb-1"><MapPin size={10} color="#9CA3AF" /><Text className="text-gray-400 text-xs">{item.location}</Text></View>
                )}
                <View className="w-full h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}>
                  <View className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })
        )}</View>
    </>
  );
}
