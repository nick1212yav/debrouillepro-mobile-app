import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Search, Tag, MapPin, Heart, Plus,
  Phone, MessageCircle, Eye, Share2, AlertCircle,
  Car, Home, Briefcase, Wrench, Package, ShoppingBag, Zap, X,
} from "lucide-react-native";
import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton";
type AnnType = "Tout" | "Immobilier" | "Véhicules" | "Emploi" | "Services" | "Objets" | "Électronique";

const CATS: AnnType[] = ["Tout", "Immobilier", "Véhicules", "Emploi", "Services", "Objets", "Électronique"];
const CAT_ICONS: Record<string, typeof Tag> = {
  "Immobilier": Home, "Véhicules": Car, "Emploi": Briefcase,
  "Services": Wrench, "Objets": Package, "Électronique": Zap, "Tout": ShoppingBag,
};

type PubType = "immo" | "job" | "service" | "evenement" | "community" | "agri" | "sante" | "transport" | "annonce" | "restauration" | "hebergement" | "energie" | "ong";

const CAT_TO_TYPE: Record<AnnType, PubType | undefined> = {
  "Tout": undefined,
  "Immobilier": "immo",
  "Véhicules": "transport",
  "Emploi": "job",
  "Services": "service",
  "Objets": "annonce",
  "Électronique": "annonce",
};

const TYPE_TO_CAT: Record<string, string> = {
  immo: "Immobilier", transport: "Véhicules", job: "Emploi",
  service: "Services", annonce: "Objets",
};

export default function AnnoncesPage({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<AnnType>("Tout");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ _id: string; title: string; description: string; price?: string; images: string[]; location?: string; type: string; tags: string[]; viewCount: number; likeCount: number } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCat, setNewCat] = useState<AnnType>("Objets");
  const [saving, setSaving] = useState(false);

  const createPublication = useMutation(api.publications.createPublication);

  const dbType = CAT_TO_TYPE[filter];
  const { results, status } = usePaginatedQuery(
    api.publications.listFeed,
    dbType ? { type: dbType } : {},
    { initialNumItems: 20 }
  );

  const filtered = results.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.location ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const toggleFav = (id: string) =>
    setFavorites((f) => { const n = new Set(f); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });

  const handleCreate = async () => {
    if (!newTitle.trim()) { UIService.openToast("Titre requis", "error"); return; }
    setSaving(true);
    try {
      await createPublication({
        type: CAT_TO_TYPE[newCat] ?? "annonce",
        title: newTitle,
        description: newDesc || newTitle,
        price: newPrice || undefined,
        images: [],
        tags: [newCat.toLowerCase()],
      });
      UIService.openToast("Annonce publiée !", "success");
      setShowCreate(false);
      setNewTitle(""); setNewDesc(""); setNewPrice("");
    } catch { UIService.openToast("Erreur lors de la publication", "error"); }
    finally { setSaving(false); }
  };

  return (
    <View className="h-full flex flex-col" style={{  }}>
      <View className="flex-shrink-0 px-4 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Annonces</Text>
            <Text className="text-xs text-white/50">{filtered.length} annonces</Text>
          </View>
          <Pressable onPress={() => setShowCreate(true)} className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{  }}>
            <Plus size={20} className="text-white" />
          </Pressable>
        </View>

        <View className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
          <Search size={16} className="text-white/40" />
          <TextInput value={search} onChangeText={(text) => setSearch(text)} placeholder="Chercher une annonce..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
        </View>

        <View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATS.map((c) => {
            const Icon = CAT_ICONS[c] ?? Tag;
            return (
              <Pressable key={c} onPress={() => setFilter(c)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: filter === c ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.07)", borderColor: "rgba(245,158,11,0.5)", borderStyle: "solid" }}>
                <Icon size={13} />{c}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6">
        {status === "LoadingFirstPage" ? (
          <View className="gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />)}
          </View>
        ) : filtered.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16 gap-3">
            <ShoppingBag size={40} className="text-white/20" />
            <Text className="text-white/40 text-sm">Aucune annonce trouvée</Text>
          </View>
        ) : (
          <View className="gap-3">
            {filtered.map((a, i) => (
              <Pressable key={a._id}
                className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                onPress={() => setSelected(a)}>
                <View className="relative">
                  {a.images[0] ? (
                    <Image className="w-full h-28 object-cover"  source={{ uri: a.images[0] }} accessibilityLabel={a.title}/>
                  ) : (
                    <View className="w-full h-28 flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.08)" }}>
                      <ShoppingBag size={32} className="text-amber-400/30" />
                    </View>
                  )}
                  <View className="absolute inset-0" style={{  }} />
                  <Pressable onPress={(e) => { toggleFav(a._id); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <Heart size={13} className={favorites.has(a._id) ? "fill-rose-500 text-rose-500" : "text-white"} />
                  </Pressable>
                </View>
                <View className="p-2.5">
                  <Text className="text-white/40 text-xs mb-0.5">{TYPE_TO_CAT[a.type] ?? a.type}</Text>
                  <Text className="text-white font-medium text-xs leading-tight">{a.title}</Text>
                  {a.price && <Text className="text-amber-400 font-bold text-sm mt-1">{a.price}</Text>}
                  {a.location && (
                    <View className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-white/30" />
                      <Text className="text-white/30 text-xs truncate">{a.location}</Text>
                    </View>
                  )}
                  <View className="flex items-center gap-1 mt-1">
                    <Eye size={10} className="text-white/20" />
                    <Text className="text-white/20 text-[10px]">{a.viewCount}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Detail modal */}
      <>
        {selected && (
          <View className="absolute inset-0 z-50 flex flex-col"
            style={{  }}>
            <View className="relative flex-shrink-0">
              {selected.images[0] ? (
                <Image className="w-full h-56 object-cover"  source={{ uri: selected.images[0] }} accessibilityLabel={selected.title}/>
              ) : (
                <View className="w-full h-56 flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,0.08)" }}>
                  <ShoppingBag size={48} className="text-amber-400/20" />
                </View>
              )}
              <View className="absolute inset-0" style={{  }} />
              <Pressable onPress={() => setSelected(null)} className="absolute top-12 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <X size={20} className="text-white" />
              </Pressable>
              <Pressable className="absolute top-12 right-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <Share2 size={18} className="text-white" />
              </Pressable>
              <View className="absolute bottom-4 left-4 right-4">
                <Text className="px-2 py-0.5 rounded text-xs font-medium text-white/80 mb-1.5 inline-block" style={{ backgroundColor: "rgba(245,158,11,0.4)" }}>{TYPE_TO_CAT[selected.type] ?? selected.type}</Text>
                <Text className="text-white text-xl font-bold">{selected.title}</Text>
                {selected.location && (
                  <View className="flex items-center gap-1 mt-1"><MapPin size={12} className="text-white/50" /><Text className="text-white/60 text-xs">{selected.location}</Text></View>
                )}
              </View>
            </View>
            <View className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
              {selected.price && <Text className="text-amber-400 text-2xl font-bold mb-4">{selected.price}</Text>}
              <Text className="text-white/70 text-sm mb-4">{selected.description}</Text>
              {selected.tags.length > 0 && (
                <View className="flex gap-2 flex-wrap mb-4">
                  {selected.tags.map((t) => (
                    <Text key={t} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#FCD34D" }}>#{t}</Text>
                  ))}
                </View>
              )}
              <View className="flex gap-3">
                <Pressable className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold"
                  style={{  }}>
                  <Phone size={16} /><Text>Appeler</Text></Pressable>
                <Pressable className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                  <MessageCircle size={16} className="text-white" /><Text className="text-white text-sm"><Text>Message</Text></Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </>

      {/* Create annonce sheet */}
      <>
        {showCreate && (
          <Pressable className="absolute inset-0 z-50 flex flex-col justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={() => setShowCreate(false)}>
            <Pressable className="rounded-t-3xl p-6"
              style={{ backgroundColor: "#0D1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} onPress={(e) => e.stopPropagation()}>
              <View className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
              <View className="flex items-center gap-3 mb-4">
                <AlertCircle size={20} className="text-amber-400" />
                <Text className="text-white font-bold text-lg">Publier une annonce</Text>
              </View>
              <View className="space-y-3 mb-4">
                <TextInput value={newTitle} onChangeText={(text) => setNewTitle(text)}
                  placeholder="Titre de l'annonce"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />
                <TextInput value={newDesc} onChangeText={(text) => setNewDesc(text)}
                  placeholder="Description"
                 
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}  multiline textAlignVertical="top"/>
                <TextInput value={newPrice} onChangeText={(text) => setNewPrice(text)}
                  placeholder="Prix (optionnel)"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />
              </View>
              <View className="gap-2 mb-4">
                {CATS.filter((c) => c !== "Tout").map((c) => {
                  const Icon = CAT_ICONS[c] ?? Tag;
                  return (
                    <Pressable key={c} onPress={() => setNewCat(c)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl"
                      style={{ backgroundColor: newCat === c ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.5)", borderStyle: "solid" }}>
                      <Icon size={18} className="text-amber-400" />
                      <Text className="text-white/70 text-xs text-center">{c}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => { void handleCreate(); }} disabled={saving}
                className="w-full py-3.5 rounded-xl text-white font-bold mb-2"
                style={{ opacity: saving ? 0.7 : 1 }}>
                {saving ? "Publication…" : "Publier"}
              </Pressable>
              <Pressable onPress={() => setShowCreate(false)} className="w-full py-3.5 rounded-xl text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><Text>Annuler</Text></Pressable>
            </Pressable>
          </Pressable>
        )}
      </>
    </View>
  );
}
