import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput, Image } from "react-native";
import { useState } from "react";
import { ArrowLeft, Scale, AlertTriangle, FileText, Shield, Phone, MapPin, ChevronRight, CheckCircle, Plus, Search, BookOpen, Users } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "signalement", label: "Signalement", icon: AlertTriangle, color: "#EF4444", desc: "Signaler une injustice" },
  { id: "droits", label: "Mes droits", icon: BookOpen, color: "#6366F1", desc: "Connaître vos droits" },
  { id: "aide", label: "Aide juridique", icon: Scale, color: "#10B981", desc: "Avocats & assistants" },
  { id: "urgences", label: "Urgences", icon: Phone, color: "#F59E0B", desc: "Numéros d'urgence" },
];

const RIGHTS = [
  { title: "Droit au travail", desc: "Tout citoyen a le droit d'accéder au travail sans discrimination.", article: "Art. 12 Constitution" },
  { title: "Liberté d'expression", desc: "La liberté de pensée, de conscience et de religion est garantie.", article: "Art. 9 Constitution" },
  { title: "Droit à l'éducation", desc: "L'enseignement primaire est obligatoire et gratuit.", article: "Art. 7 Loi éducation" },
  { title: "Protection contre arrestation", desc: "Toute personne arrêtée doit être informée de ses droits.", article: "Art. 21 Constitution" },
  { title: "Accès à la justice", desc: "Chaque citoyen a le droit d'être entendu équitablement.", article: "Art. 20 Constitution" },
];

const LAWYERS = [
  { name: "Me. Kouassi Jean", specialty: "Droit pénal", rating: 4.8, price: "Gratuit (aide légale)", available: true, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop" },
  { name: "Me. Diallo Fatou", specialty: "Droit du travail", rating: 4.9, price: "15 000 FCFA/h", available: true, avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=60&h=60&fit=crop" },
  { name: "Me. Traoré Paul", specialty: "Droit civil", rating: 4.6, price: "Aide juridictionnelle", available: false, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop" },
];

const EMERGENCY_NUMBERS = [
  { label: "Police Nationale", number: "111", color: "#6366F1" },
  { label: "Gendarmerie", number: "113", color: "#10B981" },
  { label: "Aide Juridique", number: "80 000 001", color: "#F59E0B" },
  { label: "Défenseur des droits", number: "39 77", color: "#8B5CF6" },
];

function SignalementTab() {
  const reports = useQuery(api.civic.listMyJusticeReports, {});
  const createReport = useMutation(api.civic.createJusticeReport);
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportLoc, setReportLoc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reportType || !reportDesc) return;
    setSubmitting(true);
    try {
      await createReport({ type: reportType, description: reportDesc, location: reportLoc || undefined });
      toast.success("Signalement enregistré");
      setShowForm(false);
      setReportType(""); setReportDesc(""); setReportLoc("");
    } catch {
      toast.error("Erreur lors du signalement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Pressable onPress={() => setShowForm(true)} className="w-full flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderStyle: "solid" }}><View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.2)" }}><Plus size={18} color="#EF4444" /></View><View className="text-left"><Text className="text-white font-semibold text-sm">Nouveau signalement</Text><Text className="text-gray-400 text-xs">Signalez une injustice anonymement</Text></View></Pressable>

      {showForm && (
        <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
          <Text className="text-white font-bold">Formulaire de signalement</Text>
          <Picker onValueChange={value => setReportType(value)} className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} selectedValue={reportType}><Picker.Item label="Type d'injustice..." value="" /><Picker.Item label="Corruption" value="Corruption" /><Picker.Item label="Abus de pouvoir" value="Abus de pouvoir" /><Picker.Item label="Fraude" value="Fraude" /><Picker.Item label="Discrimination" value="Discrimination" /><Picker.Item label="Violence" value="Violence" /></Picker>
          <TextInput value={reportLoc} onChangeText={value => setReportLoc(value)} placeholder="Localisation (optionnel)..." className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} />
          <TextInput value={reportDesc} onChangeText={value => setReportDesc(value)} placeholder="Décrivez les faits..." className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} multiline textAlignVertical="top" />
          <View className="flex gap-2"><Pressable onPress={() => setShowForm(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><Text>Annuler</Text></Pressable><Pressable onPress={handleSubmit} disabled={submitting || !reportType || !reportDesc} className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-50" style={{ backgroundColor: "#EF4444" }}>{submitting ? "Envoi..." : "Signaler"}</Pressable></View>
        </View>
      )}

      <Text className="text-white font-semibold text-sm">Mes signalements</Text>
      {reports === undefined ? (
        <View className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</View>
      ) : reports.length === 0 ? (
        <View className="text-center py-6"><FileText size={32} className="mx-auto mb-2 text-white/20" /><Text className="text-gray-500 text-sm">Aucun signalement pour l'instant</Text></View>
      ) : reports.map((r, i) => (
        <View key={r._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
          <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}><AlertTriangle size={16} color="#EF4444" /></View>
          <View className="flex-1"><Text className="text-white font-semibold text-sm">{r.type}</Text>{r.location && (
              <View className="flex items-center gap-1 mt-0.5"><MapPin size={10} color="#9CA3AF" /><Text className="text-gray-400 text-xs">{r.location}</Text></View>
            )}<Text className="text-gray-500 text-xs mt-0.5">{r.description}</Text></View>
          <View className="text-right"><Text className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: r.status === "Résolu" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: r.status === "Résolu" ? "#10B981" : "#F59E0B" }}>{r.status}</Text></View>
        </View>
      ))}
    </>
  );
}

export default function JusticePage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("signalement");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRights = RIGHTS.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}><View className="flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex-1"><Text className="text-white font-bold text-lg">Justice & Signalement</Text><Text className="text-gray-400 text-xs">Défendez vos droits</Text></View><View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(156,163,175,0.15)" }}><Scale size={16} color="#9CA3AF" /></View></View><View className="flex gap-2 px-4 mb-4 overflow-x-auto" style={{  }}>{CATEGORIES.map(cat => (
          <Pressable key={cat.id} onPress={() => setActiveTab(cat.id)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium" style={{ backgroundColor: activeTab === cat.id ? cat.color : "rgba(255,255,255,0.06)" }}><cat.icon size={12} />{cat.label}</Pressable>
        ))}</View><View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4" style={{  }}>{activeTab === "signalement" && (
          <>
            <Authenticated><SignalementTab /></Authenticated>
            <Unauthenticated>
              <View className="text-center py-8"><Scale size={40} className="mx-auto mb-3 text-white/20" /><Text className="text-white/60 text-sm">Connectez-vous pour soumettre des signalements</Text></View>
            </Unauthenticated>
            <AuthLoading><Skeleton className="h-40 w-full rounded-2xl" /></AuthLoading>
          </>
        )}{activeTab === "droits" && (
          <>
            <View className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Search size={14} color="#9CA3AF" /><TextInput value={searchQuery} onChangeText={value => setSearchQuery(value)} placeholder="Rechercher un droit..." className="flex-1 bg-transparent text-white text-sm outline-none" /></View>
            {filteredRights.map((right, i) => (
              <View key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex items-start justify-between gap-2"><View className="flex-1"><Text className="text-white font-semibold text-sm">{right.title}</Text><Text className="text-gray-400 text-xs mt-1">{right.desc}</Text></View><Text className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#A5B4FC" }}>{right.article}</Text></View>
              </View>
            ))}
          </>
        )}{activeTab === "aide" && (
          <>
            <View className="p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}><Shield size={14} color="#10B981" /><Text className="text-green-400 text-xs">Aide juridique gratuite disponible pour les cas éligibles</Text></View>
            {LAWYERS.map((l, i) => (
              <View key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <Image className="w-12 h-12 rounded-full" source={{ uri: l.avatar }} accessibilityLabel="" />
                <View className="flex-1"><View className="flex items-center gap-2"><Text className="text-white font-semibold text-sm">{l.name}</Text>{l.available && <View className="w-2 h-2 rounded-full bg-green-500" />}</View><Text className="text-gray-400 text-xs">{l.specialty}</Text><Text className="text-xs mt-0.5" style={{ color: "#10B981" }}>{l.price}</Text></View>
                <View className="text-right"><View className="flex items-center gap-1"><Text className="text-yellow-400 text-xs">★</Text><Text className="text-white text-xs">{l.rating}</Text></View><ChevronRight size={14} color="#9CA3AF" className="mt-1" /></View>
              </View>
            ))}
          </>
        )}{activeTab === "urgences" && (
          <>
            <View className="p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}><Text className="text-red-400 text-xs text-center font-medium">En cas de danger immédiat, appelez immédiatement</Text></View>
            {EMERGENCY_NUMBERS.map((e, i) => (
              <View key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex items-center gap-3"><View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${e.color}20` }}><Phone size={16} color={e.color} /></View><Text className="text-white font-semibold text-sm">{e.label}</Text></View>
                <View className="px-4 py-2 rounded-xl font-bold text-sm" style={{ backgroundColor: e.color }}>{e.number}</View>
              </View>
            ))}
            <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-3"><Users size={16} color="#8B5CF6" /><Text className="text-white font-semibold text-sm">Témoins protégés</Text></View><Text className="text-gray-400 text-xs">Si vous êtes témoin d'une injustice, vous pouvez signaler anonymement. Votre identité est protégée par la loi.</Text><Pressable className="mt-3 w-full py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: "#8B5CF6" }}>Signalement anonyme
              </Pressable></View>
          </>
        )}</View></View>
  );
}
