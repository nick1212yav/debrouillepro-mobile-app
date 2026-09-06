import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Building, MapPin, Search, FileText, Clock, 
  CheckCircle, AlertCircle, Info, X, Download, Eye, Users, Landmark,
  HardHat, Map, BarChart2, Layers, Plus
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
const PROJECTS = [
  {
    id: 1, title: "Extension Boulevard de la Paix", category: "Voirie",
    location: "Cocody, Abidjan", status: "En cours", progress: 65,
    budget: "4.2 Mds FCFA", deadline: "Déc 2025",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    desc: "Élargissement et modernisation du boulevard sur 3,5 km avec pistes cyclables et éclairage LED.",
    impact: "120 000 habitants", contractor: "BNETD",
    phases: ["Études", "Appel d'offres", "Travaux", "Réception"],
    currentPhase: 2,
  },
  {
    id: 2, title: "Marché Moderne de Yopougon", category: "Commerce",
    location: "Yopougon, Abidjan", status: "Planifié", progress: 15,
    budget: "1.8 Md FCFA", deadline: "Juin 2026",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&q=80",
    desc: "Construction d'un marché de 450 boutiques avec parking souterrain et espace restauration.",
    impact: "2 500 commerçants", contractor: "AGEROUTE",
    phases: ["Études", "Financement", "Appel d'offres", "Travaux"],
    currentPhase: 1,
  },
  {
    id: 3, title: "Réseau d'Assainissement Zone 3", category: "Assainissement",
    location: "Marcory, Abidjan", status: "Terminé", progress: 100,
    budget: "780 M FCFA", deadline: "Mars 2025",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80",
    desc: "Réhabilitation complète du réseau d'eaux usées sur 12 km pour 35 000 foyers.",
    impact: "35 000 foyers", contractor: "SODECI",
    phases: ["Études", "Appel d'offres", "Travaux", "Réception"],
    currentPhase: 3,
  },
  {
    id: 4, title: "Parc Urbain des Deux Plateaux", category: "Espaces verts",
    location: "Deux Plateaux, Abidjan", status: "En cours", progress: 40,
    budget: "320 M FCFA", deadline: "Sept 2025",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&q=80",
    desc: "Aménagement d'un parc de 6 hectares avec aires de jeux, piste de jogging et jardins.",
    impact: "80 000 visiteurs/an", contractor: "Mairie",
    phases: ["Études", "Appel d'offres", "Travaux", "Réception"],
    currentPhase: 2,
  },
];

const CATS = ["Tout", "Voirie", "Commerce", "Assainissement", "Espaces verts", "Infrastructure"];
const STATUS_COLORS: Record<string, string> = {
  "En cours": "#F59E0B", "Planifié": "#6366F1", "Terminé": "#10B981",
};

const PERMIT_TYPES = ["Permis de construire", "Permis de démolir", "Permis d'aménager", "Déclaration préalable"];

function PermitsSection() {
  const permits = useQuery(api.urban.listMyPermits);
  const submitPermit = useMutation(api.urban.submitPermit);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState(PERMIT_TYPES[0]);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!address.trim()) { UIService.openToast("Veuillez saisir une adresse", "error"); return; }
    setSubmitting(true);
    try {
      await submitPermit({ type, address });
      UIService.openToast("Dossier déposé avec succès !", "success");
      setShowForm(false);
      setAddress("");
    } catch {
      UIService.openToast("Erreur lors du dépôt", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="space-y-3">
      <View className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(99,102,241,0.1)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}>
        <View className="flex items-center gap-2">
          <FileText size={18} className="text-indigo-400" />
          <Text className="text-white font-medium text-sm">Suivi de dossier</Text>
        </View>
        <Pressable onPress={() => setShowForm(!showForm)} className="px-3 py-1.5 rounded-lg text-xs text-white" style={{ backgroundColor: "rgba(99,102,241,0.4)" }}>
          <Plus size={12} className="inline mr-1" /><Text>Déposer</Text></Pressable>
      </View>

      <>
        {showForm && (
          <View
            className="p-4 rounded-xl space-y-3 overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}>
            <Text className="text-white font-medium text-sm">Nouveau dossier</Text>
            <View>
              <Text className="text-white/50 text-xs mb-1.5">Type de permis</Text>
              <View className="space-y-1.5">
                {PERMIT_TYPES.map((t) => (
                  <Pressable key={t} onPress={() => setType(t)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs"
                    style={{ backgroundColor: t ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.04)", borderColor: "rgba(99,102,241,0.5)", borderStyle: "solid" }}>
                    {t}
                  </Pressable>
                ))}
              </View>
            </View>
            <View>
              <Text className="text-white/50 text-xs mb-1.5">Adresse du bien</Text>
              <TextInput value={address} onChangeText={(text) => setAddress(text)} placeholder="Ex: Lot 12, Riviera 3, Abidjan"
                className="w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} />
            </View>
            <Pressable onPress={() => { void handleSubmit(); }} disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{  }}>
              {submitting ? "Dépôt en cours..." : "Soumettre le dossier"}
            </Pressable>
          </View>
        )}
      </>

      {permits && permits.length === 0 && !showForm && (
        <View className="text-center py-8">
          <FileText size={36} className="text-white/20 mx-auto mb-2" />
          <Text className="text-white/40 text-sm">Aucun dossier déposé</Text>
          <Text className="text-white/25 text-xs mt-1">Cliquez sur {"\""}Déposer{"\""}  pour commencer</Text>
        </View>
      )}

      {permits?.map((permit, i) => (
        <View key={permit._id}
          className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
          <View className="flex items-start justify-between mb-2">
            <View>
              <Text className="text-white font-medium text-sm">{permit.type}</Text>
              <Text className="text-white/40 text-xs mt-0.5">{permit.permitId}</Text>
            </View>
            <Text className="px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: permit.status === "Approuvé" ? "rgba(16,185,129,0.2)" : permit.status === "En attente" ? "rgba(245,158,11,0.2)" : "rgba(99,102,241,0.2)", color: permit.status === "Approuvé" ? "#10B981" : permit.status === "En attente" ? "#F59E0B" : "#818CF8" }}>{permit.status}</Text>
          </View>
          <View className="flex items-center gap-3">
            <View className="flex items-center gap-1"><MapPin size={11} className="text-white/30" /><Text className="text-white/50 text-xs">{permit.address}</Text></View>
            <View className="flex items-center gap-1 ml-auto"><Clock size={11} className="text-white/30" /><Text className="text-white/40 text-xs">{permit.date}</Text></View>
          </View>
          <View className="flex gap-2 mt-3">
            <Pressable className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <Eye size={13} className="text-white/60" /><Text className="text-white/60 text-xs">Voir</Text>
            </Pressable>
            <Pressable className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <Download size={13} className="text-white/60" /><Text className="text-white/60 text-xs">Télécharger</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function UrbanismePage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"projets" | "permis" | "carte">("projets");
  const [filter, setFilter] = useState("Tout");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof PROJECTS[0] | null>(null);

  const filtered = PROJECTS.filter(p =>
    (filter === "Tout" || p.category === filter) &&
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="h-full flex flex-col" style={{  }}>
      <View className="flex-shrink-0 px-4 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Urbanisme</Text>
            <Text className="text-xs text-white/50">Projets & permis de construire</Text>
          </View>
          <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(99,102,241,0.2)" }}>
            <Building size={18} className="text-indigo-400" />
          </View>
        </View>

        <View className="flex gap-1 p-1 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {(["projets", "permis", "carte"] as const).map(t => (
            <Pressable key={t} onPress={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-medium capitalize"
              style={{ backgroundColor: tab === t ? "rgba(99,102,241,0.5)" : "transparent" }}>
              {t === "projets" ? "Projets" : t === "permis" ? "Permis" : "Carte"}
            </Pressable>
          ))}
        </View>

        {tab === "projets" && (
          <>
            <View className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <Search size={16} className="text-white/40" />
              <TextInput value={search} onChangeText={text => setSearch(text)} placeholder="Chercher un projet..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
            </View>
            <View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATS.map(c => (
                <Pressable key={c} onPress={() => setFilter(c)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: filter === c ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)" }}>
                  {c}
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6">
        {tab === "projets" && (
          <View className="space-y-4">
            {filtered.map((p, i) => (
              <Pressable key={p.id}
                className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                onPress={() => setSelected(p)}>
                <View className="relative">
                  <Image className="w-full h-36 object-cover"  source={{ uri: p.image }} accessibilityLabel={p.title}/>
                  <View className="absolute inset-0" style={{  }} />
                  <View className="absolute top-3 left-3">
                    <Text className="px-2 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: `${STATUS_COLORS[p.status] ?? "#6366F1"}80` }}>{p.status}</Text>
                  </View>
                  <View className="absolute top-3 right-3">
                    <Text className="px-2 py-1 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>{p.category}</Text>
                  </View>
                </View>
                <View className="p-3">
                  <Text className="text-white font-semibold text-sm mb-1">{p.title}</Text>
                  <View className="flex items-center gap-2 mb-2">
                    <MapPin size={11} className="text-white/40" />
                    <Text className="text-white/50 text-xs">{p.location}</Text>
                    <Text className="text-white/30 text-xs ml-auto">{p.budget}</Text>
                  </View>
                  <View className="flex items-center gap-2 mb-1">
                    <View className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <View className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: STATUS_COLORS[p.status] ?? "#6366F1" }} />
                    </View>
                    <Text className="text-white/50 text-xs">{p.progress}%</Text>
                  </View>
                  <View className="flex items-center gap-3 mt-2">
                    <View className="flex items-center gap-1"><Users size={11} className="text-white/30" /><Text className="text-white/40 text-xs">{p.impact}</Text></View>
                    <View className="flex items-center gap-1 ml-auto"><Clock size={11} className="text-white/30" /><Text className="text-white/40 text-xs">{p.deadline}</Text></View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {tab === "permis" && (
          <Authenticated>
            <PermitsSection />
          </Authenticated>
        )}
        {tab === "permis" && (
          <Unauthenticated>
            <View className="space-y-3">
              <View className="p-4 rounded-xl text-center" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}>
                <FileText size={32} className="text-indigo-400 mx-auto mb-2" />
                <Text className="text-white font-medium text-sm">Connectez-vous pour suivre vos dossiers</Text>
                <Text className="text-white/50 text-xs mt-1">Déposez et suivez vos permis de construire</Text>
              </View>
            </View>
          </Unauthenticated>
        )}

        {tab === "carte" && (
          <View className="space-y-4">
            <View className="rounded-2xl overflow-hidden h-48 flex items-center justify-center" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 2, borderColor: "rgba(99,102,241,0.3)", borderStyle: "dashed" }}>
              <View className="flex flex-col items-center gap-2">
                <Map size={40} className="text-indigo-400/50" />
                <Text className="text-indigo-300/60 text-sm">Carte interactive des projets</Text>
                <Text className="text-white/30 text-xs">Visualisation géographique</Text>
              </View>
            </View>
            <View className="gap-3">
              {[
                { icon: HardHat, label: "Projets actifs", value: "24", color: "#F59E0B" },
                { icon: CheckCircle, label: "Terminés 2025", value: "8", color: "#10B981" },
                { icon: Users, label: "Habitants impactés", value: "540k", color: "#6366F1" },
                { icon: BarChart2, label: "Budget total", value: "18.3 Mds", color: "#EC4899" },
              ].map(({ icon: Icon, label, value, color }) => (
                <View key={label} className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <Icon size={20} style={{ color }} className="mb-2" />
                  <Text className="text-white font-bold text-lg">{value}</Text>
                  <Text className="text-white/50 text-xs">{label}</Text>
                </View>
              ))}
            </View>
            <View className="p-4 rounded-xl" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}>
              <View className="flex items-center gap-2 mb-3">
                <Layers size={16} className="text-indigo-400" />
                <Text className="text-white font-medium text-sm">Zones de développement</Text>
              </View>
              {[
                { zone: "Zone Nord (Abobo, Anyama)", type: "Résidentiel", color: "#6366F1" },
                { zone: "Zone Est (Bingerville, Grand-Bassam)", type: "Touristique", color: "#10B981" },
                { zone: "Zone Industrielle (PK 24-44)", type: "Industriel", color: "#F59E0B" },
                { zone: "Centre Affaires (Plateau)", type: "Tertiaire", color: "#EC4899" },
              ].map(z => (
                <View key={z.zone} className="flex items-center gap-2 py-2 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <Text className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                  <Text className="text-white/70 text-xs flex-1">{z.zone}</Text>
                  <Text className="text-white/40 text-xs">{z.type}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <>
        {selected && (
          <View className="absolute inset-0 z-50 flex flex-col"
            style={{  }}>
            <View className="relative flex-shrink-0">
              <Image className="w-full h-52 object-cover"  source={{ uri: selected.image }} accessibilityLabel={selected.title}/>
              <View className="absolute inset-0" style={{  }} />
              <Pressable onPress={() => setSelected(null)} className="absolute top-12 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <X size={20} className="text-white" />
              </Pressable>
              <View className="absolute bottom-4 left-4 right-4">
                <Text className="px-2 py-1 rounded-lg text-xs font-semibold text-white mr-2" style={{ backgroundColor: `${STATUS_COLORS[selected.status] ?? "#6366F1"}80` }}>{selected.status}</Text>
                <Text className="text-white text-xl font-bold mt-1">{selected.title}</Text>
                <View className="flex items-center gap-2 mt-1"><MapPin size={12} className="text-white/60" /><Text className="text-white/60 text-xs">{selected.location}</Text></View>
              </View>
            </View>
            <View className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
              <Text className="text-white/70 text-sm mb-4">{selected.desc}</Text>
              <View className="gap-3 mb-4">
                {[
                  { label: "Budget", value: selected.budget, icon: BarChart2 },
                  { label: "Échéance", value: selected.deadline, icon: Clock },
                  { label: "Impact", value: selected.impact, icon: Users },
                  { label: "Maître d'œuvre", value: selected.contractor, icon: Landmark },
                ].map(({ label, value, icon: Icon }) => (
                  <View key={label} className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <Icon size={14} className="text-indigo-400 mb-1" />
                    <Text className="text-white/40 text-xs">{label}</Text>
                    <Text className="text-white font-semibold text-sm">{value}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-white font-semibold text-sm mb-3">Avancement des phases</Text>
              <View className="space-y-2 mb-4">
                {selected.phases.map((phase, idx) => (
                  <View key={phase} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: idx <= selected.currentPhase ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)" }}>
                    <View className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: idx < selected.currentPhase ? "#10B981" : idx === selected.currentPhase ? "#6366F1" : "rgba(255,255,255,0.1)" }}>
                      {idx < selected.currentPhase ? <CheckCircle size={14} className="text-white" /> : <Text className="text-white text-xs">{idx + 1}</Text>}
                    </View>
                    <Text className={`text-sm ${idx <= selected.currentPhase ? "text-white" : "text-white/30"}`}>{phase}</Text>
                    {idx === selected.currentPhase && <Text className="ml-auto text-xs text-indigo-400 font-medium">En cours</Text>}
                  </View>
                ))}
              </View>
              <View className="flex items-center gap-2 mb-4">
                <View className="flex-1 h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <View className="h-full rounded-full" style={{ width: `${selected.progress}%` }} />
                </View>
                <Text className="text-indigo-400 font-bold text-sm">{selected.progress}%</Text>
              </View>
              <View className="flex gap-3">
                <Pressable className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium"
                  style={{  }}>
                  <Info size={16} /><Text>Plus d'infos</Text></Pressable>
                <Pressable className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                  <AlertCircle size={16} className="text-white" /><Text className="text-white text-sm"><Text>Signaler</Text></Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </>
    </View>
  );
}
