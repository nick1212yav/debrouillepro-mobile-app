import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { toast } from "sonner";
import {
  ArrowLeft, Heart, Users, Target, Globe, CheckCircle,
  Plus, TrendingUp, HandHeart, X, Banknote,
} from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton.tsx";

function formatAmount(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }

// ── NGO Card ──────────────────────────────────────────────────────────────────
type CampaignWithNGO = {
  _id: string; title: string; description: string;
  goal: number; raised: number; donorCount: number;
  currency: string; status: string; ngoName: string; ngoLogo?: string;
};

function CampaignCard({ campaign, onDonate }: { campaign: CampaignWithNGO; onDonate: (id: string) => void }) {
  const pct = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  const urgent = pct >= 70;

  return (
    <View whileTap={{ scale: 0.98 }} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <View className="p-4"><View className="flex items-start justify-between mb-3"><View className="flex-1"><View className="flex items-center gap-2 mb-1">{urgent && (
                <Text className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#EF4444" }}>🔥 Urgent</Text>
              )}</View><Text className="text-white font-bold text-sm leading-tight">{campaign.title}</Text><Text className="text-white/50 text-xs mt-0.5">{campaign.ngoName}</Text></View></View><Text className="text-white/60 text-xs leading-relaxed mb-3">{campaign.description}</Text><View className="mb-3"><View className="flex justify-between text-[10px] text-white/50 mb-1"><Text>{formatAmount(campaign.raised)}collectés</Text><Text className="font-bold" style={{ color: urgent ? "#EF4444" : "#10B981" }}>{pct}%</Text></View><View className="h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full" style={{  }} /></View><Text className="text-[10px] text-white/30 mt-1">Objectif : {formatAmount(campaign.goal)}· {campaign.donorCount}donateurs</Text></View><Authenticated><Pressable onPress={() => onDonate(campaign._id)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{  }}><Heart size={14} /><Text>Faire un don</Text></Pressable></Authenticated><Unauthenticated><Pressable onPress={() => toast.info("Connectez-vous pour faire un don")} className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{  }}><Heart size={14} /><Text>Faire un don</Text></Pressable></Unauthenticated></View>
    </View>
  );
}

// ── Donate Modal ──────────────────────────────────────────────────────────────
function DonateModal({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const [amount, setAmount] = useState("5000");
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(false);
  const [loading, setLoading] = useState(false);
  const donate = useMutation(api.community.donate);
  const PRESETS = ["1000", "5000", "10000", "25000"];

  const handleDonate = async () => {
    const num = parseInt(amount);
    if (!num || num < 100) { toast.error("Montant minimum : 100 FCFA"); return; }
    setLoading(true);
    try {
      await donate({
        campaignId: campaignId as Id<"ngoCampaigns">,
        amount: num,
        currency: "XOF",
        anonymous: anon,
        message: message.trim() || undefined,
      });
      toast.success("Merci pour votre don !");
      onClose();
    } catch {
      toast.error("Erreur lors du don");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
      <View initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full rounded-t-3xl p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between mb-5"><View className="flex items-center gap-2"><Heart size={18} className="text-pink-400" /><Text className="text-white font-bold">Faire un don</Text></View><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}><X size={16} className="text-white/60" /></Pressable></View>

        <View className="flex gap-2 mb-3">{PRESETS.map((p) => (
            <Pressable key={p} onPress={() => setAmount(p)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all" style={amount === p
                ? {  }
                : { backgroundColor: "rgba(255,255,255,0.06)" }}>{parseInt(p).toLocaleString()}</Pressable>
          ))}</View>

        <View className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Banknote size={16} className="text-white/40" /><TextInput value={amount} onChangeText={(value) => setAmount(value)} placeholder="Montant en FCFA" className="flex-1 bg-transparent text-white text-sm outline-none" keyboardType="numeric" /><Text className="text-white/40 text-xs">FCFA</Text></View>

        <TextInput value={message} onChangeText={(value) => setMessage(value)} placeholder="Message (optionnel)" className="w-full rounded-2xl px-4 py-3 text-sm text-white/90 outline-none mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid" }} multiline textAlignVertical="top" />

        <Pressable onPress={() => setAnon(!anon)} className="flex items-center gap-2 mb-4"><View className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: anon ? "#EC4899" : "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderStyle: "solid" }}>{anon && <CheckCircle size={10} className="text-white" />}</View><Text className="text-white/60 text-xs">Don anonyme</Text></Pressable>

        <Pressable onPress={handleDonate} disabled={loading} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{  }}><Heart size={15} />{loading ? "Traitement..." : "Confirmer le don"}</Pressable>
      </View>
    </View>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OngPage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Causes");
  const [donatingId, setDonatingId] = useState<string | null>(null);
  const [showCreateNGO, setShowCreateNGO] = useState(false);

  const campaigns = useQuery(api.community.listActiveCampaigns, {});
  const myNGO = useQuery(api.community.getMyNGO, {});
  const createNGO = useMutation(api.community.createNGO);

  const [ngoForm, setNgoForm] = useState({ name: "", mission: "", description: "", category: "humanitaire", city: "", country: "RDC", website: "", phone: "" });

  const handleCreateNGO = async () => {
    if (!ngoForm.name || !ngoForm.mission) return;
    try {
      await createNGO(ngoForm);
      toast.success("ONG créée avec succès !");
      setShowCreateNGO(false);
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>{}<View className="flex items-center gap-3 px-4 pt-6 pb-4"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex-1"><Text className="text-white font-bold text-lg">ONG & Bénévolat</Text><Text className="text-gray-400 text-xs">Dons · Missions · Impact</Text></View><View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.15)" }}><HandHeart size={16} color="#F97316" /></View></View>{}<View className="flex gap-3 px-4 mb-4">{[
          { icon: Heart, label: "Campagnes", value: campaigns?.length ?? "...", color: "#EF4444" },
          { icon: Users, label: "Donateurs", value: campaigns ? campaigns.reduce((s, c) => s + c.donorCount, 0).toLocaleString() : "...", color: "#6366F1" },
          { icon: Globe, label: "Collecté", value: campaigns ? (campaigns.reduce((s, c) => s + c.raised, 0) / 1000).toFixed(0) + "K" : "...", color: "#10B981" },
        ].map(({ icon: Icon, label, value, color }) => (
          <View key={label} className="flex-1 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Icon size={16} color={color} className="mx-auto mb-1" /><Text className="text-white font-bold text-sm">{value}</Text><Text className="text-gray-500 text-xs">{label}</Text></View>
        ))}</View>{}<View className="flex gap-1 mx-4 mb-4 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>{["Causes", "Mon ONG"].map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent" }}>{tab}</Pressable>
        ))}</View><View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4" style={{  }}>{activeTab === "Causes" && (
          <>
            {campaigns === undefined ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
            ) : campaigns.length === 0 ? (
              <View className="flex flex-col items-center py-16 gap-3"><Heart size={40} className="text-white/15" /><Text className="text-white/40 text-sm text-center">Aucune campagne active pour le moment.</Text></View>
            ) : (
              campaigns.map((campaign) => (
                <CampaignCard key={campaign._id} campaign={campaign} onDonate={setDonatingId} />
              ))
            )}
          </>
        )}{activeTab === "Mon ONG" && (
          <Authenticated>
            {myNGO === undefined ? (
              <Skeleton className="h-40 w-full rounded-2xl" />
            ) : myNGO ? (
              <View className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-3 mb-3"><View className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: "rgba(249,115,22,0.15)" }}><Text>🏛️</Text></View><View><Text className="text-white font-bold">{myNGO.name}</Text><Text className="text-white/50 text-xs">{myNGO.category}· {myNGO.city}</Text></View>{myNGO.verified && <CheckCircle size={16} className="text-green-400 ml-auto" />}</View><Text className="text-white/60 text-sm mb-3">{myNGO.mission}</Text><View className="flex gap-4 text-xs"><Text className="text-white/50"><Text className="text-white font-bold">{formatAmount(myNGO.totalDonations)}</Text>collectés</Text><Text className="text-white/50"><Text className="text-white font-bold">{myNGO.donorCount}</Text>donateurs</Text></View></View>
            ) : (
              <View className="flex flex-col items-center py-8 gap-4"><View className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}><HandHeart size={28} className="text-orange-400" /></View><View className="text-center"><Text className="text-white font-bold mb-1">Créer votre ONG</Text><Text className="text-white/50 text-xs">Lancez des campagnes et collectez des fonds pour vos projets</Text></View><Pressable onPress={() => setShowCreateNGO(true)} className="px-6 py-3 rounded-2xl text-sm font-bold text-white flex items-center gap-2" style={{  }}><Plus size={15} />Créer mon ONG
                </Pressable></View>
            )}
          </Authenticated>
        )}{activeTab === "Mon ONG" && (
          <Unauthenticated>
            <View className="text-center py-8 text-white/40">Connectez-vous pour gérer votre ONG</View>
          </Unauthenticated>
        )}</View>{}<View>{donatingId && (
          <DonateModal campaignId={donatingId} onClose={() => setDonatingId(null)} />
        )}</View>{}<View>{showCreateNGO && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
            <View initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} className="w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-5">
                <Text className="text-white font-bold">Créer mon ONG</Text>
                <Pressable onPress={() => setShowCreateNGO(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                  <X size={16} className="text-white/60" />
                </Pressable>
              </View>
              {[
                { key: "name", placeholder: "Nom de l'ONG *" },
                { key: "mission", placeholder: "Mission *" },
                { key: "description", placeholder: "Description" },
                { key: "city", placeholder: "Ville" },
                { key: "country", placeholder: "Pays" },
                { key: "website", placeholder: "Site web (optionnel)" },
                { key: "phone", placeholder: "Téléphone (optionnel)" },
              ].map(({ key, placeholder }) => (
                <TextInput key={key} value={ngoForm[key as keyof typeof ngoForm]} onChangeText={(value) => setNgoForm((p) => ({ ...p, [key]: value }))} placeholder={placeholder} className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid" }} />
              ))}
              <Pressable onPress={handleCreateNGO} disabled={!ngoForm.name || !ngoForm.mission} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white disabled:opacity-40" style={{  }}>
                Créer l'ONG
              </Pressable>
            </View>
          </View>
        )}</View></View>
  );
}

// Suppress unused icons
const _icons = [Target, TrendingUp];
void _icons;
