import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useMemo } from "react";
import {
  ArrowLeft, TrendingUp, Heart, Eye, Users,
  Zap, Gift, ChevronRight, Star, Crown, Flame,
  ArrowUpRight, Clock, CheckCircle,
  BarChart2, Sparkles, MessageCircle, Radio, FileText,
  X, AlertCircle, Wallet, Plus,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

// ── Types ─────────────────────────────────────────────────────────────────────
type TxType = "tip" | "don" | "abonnement" | "retrait" | "bonus";

const TX_CONFIG: Record<TxType, { icon: React.ElementType; color: string; label: string }> = {
  tip:          { icon: Heart,        color: "#EC4899", label: "Pourboire" },
  don:          { icon: Gift,         color: "#F59E0B", label: "Don" },
  abonnement:   { icon: Crown,        color: "#8B5CF6", label: "Abonnement" },
  retrait:      { icon: ArrowUpRight, color: "#EF4444", label: "Retrait" },
  bonus:        { icon: Star,         color: "#10B981", label: "Bonus" },
};

function fmt(n: number) { return Math.abs(n).toLocaleString("fr-FR"); }

// ─── Add Stream Modal ─────────────────────────────────────────────────────────
function AddStreamModal({ onClose, onAdd }: { onClose: () => void; onAdd: (source: string, description: string, amount: number) => void }) {
  const [source, setSource] = useState("freelance");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full rounded-t-3xl p-5" style={{ backgroundColor: "#0f1628", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between mb-4"><Text className="text-white font-black text-lg">Nouvelle source de revenus</Text><Pressable onPress={onClose} className="" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 4 }}><X size={15} className="text-white" /></Pressable></View>
        <View className="space-y-3"><View><Text className="text-white/40 text-xs mb-1 block">Source</Text><Picker onValueChange={value => setSource(value)} className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} selectedValue={source}>{["freelance", "ventes", "location", "salaire", "tips", "dons", "abonnements", "autre"].map(s => (
                <Picker.Item label={s.charAt(0).toUpperCase() + s.slice(1)} value={s} />
              ))}</Picker></View><View><Text className="text-white/40 text-xs mb-1 block">Description</Text><TextInput value={description} onChangeText={value => setDescription(value)} placeholder="Description de la source..." className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><View><Text className="text-white/40 text-xs mb-1 block">Montant mensuel estimé (FCFA)</Text><TextInput value={amount} onChangeText={value => setAmount(value)} placeholder="0" className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} keyboardType="numeric" /></View></View>
        <Pressable onPress={() => onAdd(source, description, parseFloat(amount) || 0)} disabled={!description || !amount} className="mt-4 w-full py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40" style={{  }}><Text className="text-white">Ajouter la source</Text></Pressable>
      </View>
    </View>
  );
}

// ─── Withdraw Sheet ───────────────────────────────────────────────────────────
function WithdrawSheet({ balance, onClose, onConfirm }: { balance: number; onClose: () => void; onConfirm: (montant: number) => void }) {
  const [montant, setMontant] = useState(String(balance));
  const val = parseInt(montant, 10) || 0;
  return (
    <>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="absolute inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} />
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <Text className="text-white font-black text-xl mb-1">Retirer vers Mobile Money</Text>
        <Text className="text-white/50 text-sm mb-5">Solde disponible : <Text className="text-white font-bold">{fmt(balance)}FCFA</Text></Text>
        <View className="flex flex-col gap-3 mb-5"><View className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Text className="text-white/40 text-[11px] mb-0.5">Montant à retirer (FCFA)</Text><TextInput value={montant} onChangeText={value => setMontant(value)} className="w-full bg-transparent text-white font-bold text-lg outline-none" keyboardType="numeric" /></View></View>
        <View className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}><AlertCircle size={13} className="text-white/30 mt-0.5 flex-shrink-0" /><Text className="text-white/40 text-xs">Délai de traitement : 24-48h. Frais : 1% (min. 250 FCFA).</Text></View>
        <Pressable onPress={() => val > 0 && onConfirm(val)} disabled={val <= 0 || val > balance} className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40" style={{ boxShadow: "0 4px 20px rgba(16,185,129,0.35)" }}><ArrowUpRight size={16} className="text-white" /><Text className="text-white font-black">Confirmer le retrait</Text></Pressable>
      </View>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function RevenusInner({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"dashboard" | "streams" | "transactions">("dashboard");
  const [showAddStream, setShowAddStream] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [retaitStatut, setRetaitStatut] = useState<"idle" | "loading" | "success">("idle");

  const creatorStats = useQuery(api.finances.getCreatorStats, {});
  const upsertStream = useMutation(api.revenues.upsertStream);
  const deleteStream = useMutation(api.revenues.deleteStream);
  const addEntry = useMutation(api.revenues.addEntry);

  const streams = creatorStats?.streams ?? [];
  const entries = creatorStats?.entries ?? [];
  const totalBalance = creatorStats?.totalBalance ?? 0;

  const totalGains = entries.filter(e => e.amount > 0).reduce((a, e) => a + e.amount, 0);
  const totalWithdrawals = entries.filter(e => e.amount < 0).reduce((a, e) => a + Math.abs(e.amount), 0);
  const activeStreams = streams.filter(s => s.active).length;
  const projectedMonthly = streams.filter(s => s.active && s.frequency === "mensuel").reduce((a, s) => a + s.amount, 0);

  const sparkData = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-12).map(e => e.amount);
  }, [entries]);

  const sparkMax = Math.max(...sparkData, 1);

  async function handleAddStream(source: string, description: string, amount: number) {
    try {
      await upsertStream({ source, description, amount, currency: "XAF", frequency: "mensuel", active: true });
      setShowAddStream(false);
      toast.success("Source de revenus ajoutée !");
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  }

  async function handleWithdraw(montant: number) {
    setShowWithdraw(false);
    setRetaitStatut("loading");
    try {
      await addEntry({
        amount: -montant,
        currency: "XAF",
        description: "Retrait Mobile Money",
        date: new Date().toISOString().slice(0, 10),
        category: "retrait",
      });
      setRetaitStatut("success");
      setTimeout(() => setRetaitStatut("idle"), 3000);
    } catch {
      setRetaitStatut("idle");
      toast.error("Erreur lors du retrait");
    }
  }

  return (
    <View className="h-full flex flex-col relative" style={{  }}><View className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-48 pointer-events-none" style={{  }} />{}<View className="flex-shrink-0 px-4 py-3 flex items-center gap-3 pt-safe" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}><Pressable onPress={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex-1"><Text className="text-white font-black text-lg">Revenus</Text><Text className="text-white/40 text-xs">Tableau de bord créateur</Text></View>{totalBalance > 0 && (
          <Pressable onPress={() => setShowWithdraw(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl active:scale-95 transition-all" style={{ boxShadow: "0 0 12px rgba(16,185,129,0.3)" }}><Wallet size={13} className="text-white" /><Text className="text-white font-bold text-xs">Retirer</Text></Pressable>
        )}</View>{}<View className="flex-shrink-0 flex gap-1 px-4 py-3">{[
          { id: "dashboard" as const, label: "Vue globale", icon: BarChart2 },
          { id: "streams" as const, label: "Sources", icon: Sparkles },
          { id: "transactions" as const, label: "Transactions", icon: ArrowUpRight },
        ].map(({ id, label, icon: Icon }) => (
          <Pressable key={id} onPress={() => setTab(id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all" style={tab === id
              ? {  }
              : { backgroundColor: "rgba(255,255,255,0.06)" }}><Icon size={12} />{label}</Pressable>
        ))}</View><View className="flex-1 overflow-y-auto" style={{  }}>{}{tab === "dashboard" && (
          <View className="px-4 pb-8"><View initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden mb-5"><View className="h-1.5" style={{  }} /><View className="p-5" style={{ borderWidth: 1, borderColor: "rgba(236,72,153,0.2)", borderStyle: "solid", borderTopWidth: 0 }}><Text className="text-white/50 text-sm mb-1">Solde disponible</Text><Text className="text-white font-black text-4xl mb-1">{fmt(Math.max(0, totalBalance))}<Text className="text-white/40 text-lg font-normal">FCFA</Text></Text><Text className="text-green-400 text-xs font-semibold mb-4 flex items-center gap-1"><TrendingUp size={11} />{activeStreams}source{activeStreams !== 1 ? "s" : ""}active{activeStreams !== 1 ? "s" : ""}</Text>{sparkData.length > 0 && (
                  <View className="flex items-end gap-1 h-12">{sparkData.map((v, i) => (
                      <View key={i} initial={{ height: 0 }} animate={{ height: `${(v / sparkMax) * 100}%` }} transition={{ delay: i * 0.04, duration: 0.4, ease: "easeOut" }} className="flex-1 rounded-sm" style={{  }} />
                    ))}</View>
                )}{sparkData.length === 0 && (
                  <View className="flex items-center justify-center h-12 text-white/20 text-xs"><Text>Aucune donnée disponible</Text></View>
                )}<Pressable onPress={() => setShowWithdraw(true)} className="mt-4 w-full py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all" style={{ boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}><ArrowUpRight size={16} className="text-white" /><Text className="text-white font-black">Retirer vers Mobile Money</Text></Pressable></View></View>{}<View className="gap-3 mb-5">{[
                { icon: TrendingUp, label: "Gains totaux",  value: `${fmt(totalGains)} FCFA`,  color: "#10B981" },
                { icon: ArrowUpRight, label: "Retraits",    value: `${fmt(totalWithdrawals)} FCFA`, color: "#EF4444" },
                { icon: Sparkles,  label: "Sources actives", value: `${activeStreams}`,          color: "#8B5CF6" },
                { icon: Zap,       label: "Prévision/mois", value: `${fmt(projectedMonthly)} FCFA`, color: "#F59E0B" },
              ].map(({ icon: Icon, label, value, color }) => (
                <View key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                  <View className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${color}22` }}><Icon size={16} style={{ color }} /></View>
                  <Text className="text-white font-black text-xl">{value}</Text>
                  <Text className="text-white/50 text-xs">{label}</Text>
                </View>
              ))}</View>{entries.length === 0 && (
              <View className="rounded-2xl p-6 flex flex-col items-center gap-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Sparkles size={32} color="#EC4899" /><Text className="text-white font-bold text-center">Commencez à tracker vos revenus</Text><Text className="text-white/40 text-sm text-center">Ajoutez vos sources de revenus pour voir vos statistiques</Text><Pressable onPress={() => setTab("streams")} className="px-4 py-2 rounded-xl text-sm font-bold" style={{  }}><Text>Ajouter une source</Text></Pressable></View>
            )}</View>
        )}{}{tab === "streams" && (
          <View className="px-4 pb-8">{streams.length === 0 && (
              <View className="flex flex-col items-center justify-center py-10 gap-3"><Sparkles size={40} color="#6B7280" /><Text className="text-gray-400 text-sm">Aucune source de revenus</Text><Text className="text-gray-600 text-xs">Ajoutez vos premières sources</Text></View>
            )}{streams.map((stream, idx) => (
              <View key={stream._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex items-start justify-between"><View className="flex items-center gap-3"><View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(236,72,153,0.2)" }}><Sparkles size={18} color="#EC4899" /></View><View><Text className="text-white font-bold text-sm">{stream.description}</Text><Text className="text-white/40 text-xs capitalize">{stream.source}· {stream.frequency}</Text></View></View><View className="flex items-center gap-2"><Text className="text-green-400 font-black text-base">+{fmt(stream.amount)}FCFA</Text><Pressable onPress={() => deleteStream({ streamId: stream._id as Id<"revenueStreams"> }).catch(() => toast.error("Erreur"))} className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}><X size={13} color="#EF4444" /></Pressable></View></View>
                <View className="mt-3 flex items-center gap-2"><View className="w-2 h-2 rounded-full" style={{ backgroundColor: stream.active ? "#10B981" : "#6B7280" }} /><Text className="text-[11px]" style={{ color: stream.active ? "#10B981" : "#6B7280" }}>{stream.active ? "Active" : "Inactive"}</Text>{stream.lastReceivedAt && (
                    <Text className="text-white/30 text-[10px] ml-2">Dernier reçu: {new Date(stream.lastReceivedAt).toLocaleDateString("fr-FR")}</Text>
                  )}</View>
              </View>
            ))}<Pressable onPress={() => setShowAddStream(true)} className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all" style={{ borderWidth: 1, borderColor: "rgba(236,72,153,0.3)", borderStyle: "solid" }}><Plus size={16} /><Text className="font-bold text-sm">Ajouter une source de revenus</Text></Pressable></View>
        )}{}{tab === "transactions" && (
          <View className="px-4 pb-8">{entries.length === 0 && (
              <View className="flex flex-col items-center justify-center py-12 gap-3"><ArrowUpRight size={40} color="#6B7280" /><Text className="text-gray-400 text-sm">Aucune transaction</Text></View>
            )}<View className="flex flex-col gap-2">{entries.map((entry, idx) => {
                const isPositive = entry.amount >= 0;
                const catKey = (["tip", "don", "abonnement", "retrait", "bonus"].includes(entry.category) ? entry.category : "bonus") as TxType;
                const cfg = TX_CONFIG[catKey];
                return (
                  <View key={entry._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className="flex items-start gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                    <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cfg.color}22` }}><cfg.icon size={17} style={{  }} /></View>
                    <View className="flex-1 min-w-0"><View className="flex items-center justify-between mb-0.5"><Text className="text-white font-semibold text-sm">{entry.description}</Text><Text className={`font-black text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>{isPositive ? "+" : ""}{fmt(entry.amount)}FCFA
                        </Text></View><View className="flex items-center gap-2"><Text className="text-white/30 text-[11px]">{entry.date}</Text><Text className="px-1.5 py-0.5 rounded-full text-[9px] font-bold capitalize" style={{ color: cfg.color, backgroundColor: `${cfg.color}20` }}>{entry.category}</Text></View></View>
                  </View>
                );
              })}</View><Pressable onPress={() => {
              addEntry({ amount: 5000, currency: "XAF", description: "Pourboire reçu", date: new Date().toISOString().slice(0, 10), category: "tip" })
                .then(() => toast.success("Entrée ajoutée"))
                .catch(() => toast.error("Erreur"));
            }} className="w-full mt-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2" style={{ backgroundColor: "rgba(236,72,153,0.15)", borderWidth: 1, borderColor: "rgba(236,72,153,0.3)", borderStyle: "solid" }}><Plus size={14} /><Text>Enregistrer un revenu</Text></Pressable></View>
        )}</View>{}<View>{retaitStatut === "loading" && (
          <View initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} className="absolute bottom-8 left-4 right-4 rounded-2xl px-4 py-3 flex items-center gap-3 z-50" style={{ backgroundColor: "rgba(245,158,11,0.9)" }}>
            <Clock size={20} className="text-white flex-shrink-0" />
            <Text className="text-white font-bold text-sm">Traitement en cours...</Text>
          </View>
        )}{retaitStatut === "success" && (
          <View initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} className="absolute bottom-8 left-4 right-4 rounded-2xl px-4 py-3 flex items-center gap-3 z-50" style={{  }}>
            <CheckCircle size={20} className="text-white flex-shrink-0" />
            <Text className="text-white font-bold text-sm">Retrait initié ! Délai : 24-48h</Text>
          </View>
        )}</View>{}<View>{showAddStream && <AddStreamModal onClose={() => setShowAddStream(false)} onAdd={handleAddStream} />}{showWithdraw && <WithdrawSheet balance={Math.max(0, totalBalance)} onClose={() => setShowWithdraw(false)} onConfirm={handleWithdraw} />}</View></View>
  );
}

export default function RevenusPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AuthLoading>
        <View className="h-full flex flex-col p-4 gap-3" style={{  }}><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-40 w-full rounded-2xl" /><View className="gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</View></View>
      </AuthLoading>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center gap-4 relative" style={{  }}>
          <Pressable onPress={onBack} className="absolute top-14 left-4 p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={18} color="white" />
          </Pressable>
          <Sparkles size={48} color="#6B7280" />
          <Text className="text-gray-400">Connectez-vous pour accéder à vos revenus</Text>
        </View>
      </Unauthenticated>
      <Authenticated>
        <RevenusInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
