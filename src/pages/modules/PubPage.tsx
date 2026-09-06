import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Eye, MousePointer, Plus, DollarSign, Zap, Loader2, TrendingUp,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
const FORMATS = [
  { name: "Bannière native", desc: "Intégrée dans le feed, non intrusive", price: "À partir de 5 000 FCFA/j", reach: "2 000–10 000 vues/j", color: "#6366F1" },
  { name: "Publireportage", desc: "Article sponsorisé dans l'actualité", price: "À partir de 20 000 FCFA", reach: "5 000–25 000 lectures", color: "#F59E0B" },
  { name: "Notification push", desc: "Message direct aux utilisateurs ciblés", price: "À partir de 15 000 FCFA", reach: "1 000–8 000 envois", color: "#EF4444" },
  { name: "Vidéo courte", desc: "15s avant le contenu, skippable", price: "À partir de 30 000 FCFA/j", reach: "3 000–15 000 vues/j", color: "#10B981" },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon", active: "Active", paused: "En pause", completed: "Terminée",
};

export default function PubPage({ onBack }: { onBack: () => void }) {
  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>
      <Authenticated>
        <PubContent onBack={onBack} />
      </Authenticated>
      <Unauthenticated>
        <PubContentPublic onBack={onBack} />
      </Unauthenticated>
    </View>
  );
}

function PubContent({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Campagnes");
  const [showCreate, setShowCreate] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignBudget, setCampaignBudget] = useState("50000");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const campaigns = useQuery(api.media.listMyAdCampaigns, {});
  const stats = useQuery(api.media.getAdStats, {});
  const createCampaign = useMutation(api.media.createAdCampaign);
  const updateStatus = useMutation(api.media.updateCampaignStatus);

  const handleCreate = async () => {
    if (!campaignName.trim()) { UIService.openToast("Nom requis", "error"); return; }
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await createCampaign({
        title: campaignName,
        description: campaignDesc || campaignName,
        budget: Number(campaignBudget) || 50000,
        currency: "FCFA",
        startDate: today,
        endDate: endDate,
      });
      UIService.openToast("Campagne créée !", "success");
      setShowCreate(false);
      setCampaignName(""); setCampaignDesc("");
    } catch { UIService.openToast("Erreur lors de la création", "error"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <View className="flex items-center gap-3 px-4 pt-12 pb-3">
        <Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable>
        <View className="flex-1"><Text className="text-white font-bold text-lg">Publicité & Régie</Text><Text className="text-gray-400 text-xs">Cibler · Diffuser · Analyser</Text></View>
        <Pressable onPress={() => setShowCreate(true)} className="p-2 rounded-full" style={{ backgroundColor: "rgba(245,158,11,.2)" }}><Plus size={18} color="#F59E0B" /></Pressable>
      </View>

      {/* Stats */}
      <View className="flex gap-2 px-4 mb-3">
        {stats === undefined ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="flex-1 h-16 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />)
        ) : (
          [
            { icon: Eye, label: "Impressions", value: ((stats.totalImpressions) / 1000).toFixed(0) + "K", color: "#6366F1" },
            { icon: MousePointer, label: "Clics", value: stats.totalClicks.toLocaleString(), color: "#10B981" },
            { icon: DollarSign, label: "Dépensé", value: (stats.totalSpent / 1000).toFixed(0) + "K FCFA", color: "#F59E0B" },
          ].map(({ icon: Icon, label, value, color }) => (
            <View key={label} className="flex-1 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
              <Icon size={14} color={color} className="mx-auto mb-1" />
              <Text className="text-white font-bold text-sm">{value}</Text>
              <Text className="text-gray-500 text-xs">{label}</Text>
            </View>
          ))
        )}
      </View>

      <View className="flex gap-1 mx-4 mb-3 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.04)" }}>
        {["Campagnes", "Formats"].map((tab) => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,.1)" : "transparent" }}>{tab}</Pressable>
        ))}
      </View>

      {/* Create form */}
      {showCreate && (
        <View className="mx-4 mb-3 p-4 rounded-2xl space-y-3" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.1)", borderStyle: "solid" }}>
          <Text className="text-white font-bold">Nouvelle campagne</Text>
          <TextInput value={campaignName} onChangeText={(text) => setCampaignName(text)} placeholder="Nom de la campagne..."
            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderStyle: "solid" }} />
          <TextInput value={campaignDesc} onChangeText={(text) => setCampaignDesc(text)} placeholder="Description (optionnel)"
            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderStyle: "solid" }} />
          <TextInput value={campaignBudget} onChangeText={(text) => setCampaignBudget(text)} placeholder="Budget (FCFA)"
            className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderStyle: "solid" }}  keyboardType="numeric"/>
          <View className="flex gap-2">
            <Pressable onPress={() => setShowCreate(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ backgroundColor: "rgba(255,255,255,.06)" }}><Text>Annuler</Text></Pressable>
            <Pressable onPress={() => { void handleCreate(); }} disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              style={{ backgroundColor: "#F59E0B" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Créer"}
            </Pressable>
          </View>
        </View>
      )}

      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {activeTab === "Campagnes" && (
          <>
            {campaigns === undefined ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />)
            ) : campaigns.length === 0 ? (
              <View className="flex flex-col items-center justify-center py-16 gap-3">
                <TrendingUp size={40} className="text-white/20" />
                <Text className="text-white/40 text-sm">Aucune campagne. Créez votre première !</Text>
              </View>
            ) : (
              campaigns.map((c, i) => (
                <View key={c._id}
                  className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-white font-semibold text-sm flex-1 truncate mr-2">{c.title}</Text>
                    <Pressable
                      onPress={() => { void updateStatus({ campaignId: c._id, status: c.status === "active" ? "paused" : "active" }); }}
                      className="text-xs px-2 py-1 rounded-full"
                      style={{ backgroundColor: c.status === "active" ? "rgba(16,185,129,.15)" : "rgba(156,163,175,.15)" }}>
                      {STATUS_LABEL[c.status] ?? c.status}
                    </Pressable>
                  </View>
                  <View className="gap-2 mb-3">
                    {[
                      { label: "Impressions", value: c.impressions.toLocaleString(), icon: Eye },
                      { label: "Clics", value: c.clicks.toLocaleString(), icon: MousePointer },
                      { label: "Budget", value: c.budget.toLocaleString() + " F", icon: DollarSign },
                      { label: "Dépensé", value: c.spent.toLocaleString() + " F", icon: DollarSign },
                    ].map(({ label, value, icon: Icon }) => (
                      <View key={label} className="flex items-center gap-2">
                        <Icon size={10} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs">{label}:</Text>
                        <Text className="text-white text-xs font-medium">{value}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="w-full h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}>
                    <View className="h-full rounded-full" style={{ width: `${Math.min(100, Math.round((c.spent / c.budget) * 100))}%`, backgroundColor: "#F59E0B" }} />
                  </View>
                  <Text className="text-gray-500 text-xs mt-1">{Math.round((c.spent / c.budget) * 100)}% du budget · {c.startDate} → {c.endDate}</Text>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "Formats" && FORMATS.map((f, i) => (
          <View key={i}
            className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
            <View className="flex items-center gap-3 mb-2">
              <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${f.color}20` }}>
                <Zap size={18} color={f.color} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">{f.name}</Text>
                <Text className="text-gray-400 text-xs">{f.desc}</Text>
              </View>
            </View>
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-green-400 text-xs font-medium">{f.price}</Text>
                <Text className="text-gray-500 text-xs">{f.reach}</Text>
              </View>
              <Pressable onPress={() => { setShowCreate(true); setActiveTab("Campagnes"); }} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: f.color }}><Text>Choisir</Text></Pressable>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function PubContentPublic({ onBack }: { onBack: () => void }) {
  return (
    <>
      <View className="flex items-center gap-3 px-4 pt-12 pb-3">
        <Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable>
        <View className="flex-1"><Text className="text-white font-bold text-lg">Publicité & Régie</Text></View>
      </View>
      <View className="flex flex-col items-center justify-center flex-1 gap-4 px-8">
        <TrendingUp size={48} className="text-amber-400/40" />
        <Text className="text-white/50 text-sm text-center">Connectez-vous pour gérer vos campagnes publicitaires</Text>
      </View>
    </>
  );
}
