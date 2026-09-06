import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Eye, EyeOff, Send, Download, RefreshCw,
  History, QrCode, Plus, ChevronRight, Clock, TrendingUp,
  TrendingDown, ArrowUpRight, ArrowDownLeft, Shield, Wifi,
  CheckCircle2, XCircle, AlertCircle, Target, Edit3, AlertTriangle,
  Car, ShoppingCart, Heart, Gamepad2, MoreHorizontal, Check, X, Wallet
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import type { Id } from "@/convex/_generated/dataModel.d";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Transport: Car, Alimentation: ShoppingCart, Santé: Heart,
  Loisirs: Gamepad2, Autres: MoreHorizontal,
};

const CATEGORY_COLORS: Record<string, string> = {
  Transport: "#3B82F6", Alimentation: "#10B981", Santé: "#EF4444",
  Loisirs: "#8B5CF6", Autres: "#F97316",
};

function formatAmt(n: number, currency = "XAF") {
  if (currency === "USD" || currency === "EUR") return (n / 1000).toFixed(2) + " " + currency;
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + "k FCFA";
  return n.toLocaleString() + " FCFA";
}

function WalletInner({ onBack }: { onBack: () => void }) {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "budget">("overview");
  const [showQR, setShowQR] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSend, setShowSend] = useState(false);
  const [sendAmt, setSendAmt] = useState("");
  const [sendDesc, setSendDesc] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpProvider, setTopUpProvider] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");

  const walletData = useQuery(api.finances.getWalletBalance, {});
  const transactions = useQuery(api.finances.getWalletTransactions, { limit: 20 }) ?? [];
  const budget = useQuery(api.finances.getMyBudget, {});

  const addTransaction = useMutation(api.finances.addWalletTransaction);
  const upsertBudget = useMutation(api.finances.upsertBudget);
  const updateBudgetCategory = useMutation(api.finances.updateBudgetCategory);

  const balance = walletData?.balance ?? 0;
  const monthIn = walletData?.monthIn ?? 0;
  const monthOut = walletData?.monthOut ?? 0;

  const categories = budget?.categories ?? [
    { name: "Transport", allocated: 50000, spent: 0 },
    { name: "Alimentation", allocated: 120000, spent: 0 },
    { name: "Santé", allocated: 80000, spent: 0 },
    { name: "Loisirs", allocated: 40000, spent: 0 },
    { name: "Autres", allocated: 60000, spent: 0 },
  ];

  const totalBudget = categories.reduce((s, c) => s + c.allocated, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);

  const pieData = categories.map(c => ({ name: c.name, value: c.allocated, color: CATEGORY_COLORS[c.name] ?? "#8B5CF6" }));

  // Build chart data from transactions
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const areaData = days.map(day => ({ day, dépenses: 0, revenus: 0 }));

  async function handleSend() {
    if (!sendAmt || !sendDesc) return;
    try {
      await addTransaction({
        type: "transfer",
        amount: parseFloat(sendAmt),
        currency: "XAF",
        description: sendDesc,
      });
      setShowSend(false);
      setSendAmt("");
      setSendDesc("");
      UIService.openToast("Transfert effectué !", "success");
    } catch {
      UIService.openToast("Erreur lors du transfert", "error");
    }
  }

  async function handleDeposit() {
    const amt = parseFloat(topUpAmount);
    if (!topUpProvider || !amt || amt < 500) {
      UIService.openToast("Sélectionne un opérateur et un montant (min 500 FCFA)", "error");
      return;
    }
    try {
      await addTransaction({
        type: "deposit",
        amount: amt,
        currency: "XAF",
        description: `Recharge ${topUpProvider}`,
      });
      setShowTopUp(false);
      setTopUpProvider(null);
      setTopUpAmount("");
      UIService.openToast(`Wallet rechargé de ${amt.toLocaleString()} FCFA via ${topUpProvider} !`, "success");
    } catch {
      UIService.openToast("Erreur lors de la recharge", "error");
    }
  }

  async function handleEditBudget(catName: string) {
    const val = parseFloat(editValue);
    if (isNaN(val) || val <= 0) { setEditingCat(null); return; }
    try {
      if (budget) {
        await updateBudgetCategory({ budgetId: budget._id as Id<"budgets">, categoryName: catName, allocated: val });
      } else {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const newCats = categories.map(c => c.name === catName ? { ...c, allocated: val } : c);
        await upsertBudget({
          name: "Budget mensuel",
          categories: newCats,
          currency: "XAF",
          totalAllocated: newCats.reduce((s, c) => s + c.allocated, 0),
          startDate,
        });
      }
      setEditingCat(null);
      UIService.openToast("Budget mis à jour", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  }

  function getBarColor(cat: { allocated: number; spent: number }) {
    const pct = cat.spent / cat.allocated;
    if (pct >= 1) return "#EF4444";
    if (pct >= 0.8) return "#F97316";
    return CATEGORY_COLORS[categories.find(c => c.allocated === cat.allocated)?.name ?? ""] ?? "#10B981";
  }

  return (
    <View className="relative h-full w-full overflow-hidden flex flex-col" style={{  }}>
      <View className="absolute top-0 left-0 w-72 h-72 rounded-full"
        style={{  }} />

      {/* QR Modal */}
      <>
        {showQR && (
          <Pressable onPress={() => setShowQR(false)}
            className="absolute inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
            <Pressable
              onPress={e => e.stopPropagation()} className="p-6 rounded-3xl flex flex-col items-center gap-4"
              style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }}>
              <View className="w-40 h-40 rounded-2xl overflow-hidden p-3" style={{ backgroundColor: "rgba(255,255,255,0.95)" }}>
                <View className="w-full h-full gap-0.5">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <View key={i} className="rounded-sm" style={{ backgroundColor: (i * 7 + 3) % 5 > 2 ? "#111" : "transparent", aspectRatio: "1" }} />
                  ))}
                </View>
              </View>
              <Text className="text-white font-bold text-sm">Mon QR de paiement</Text>
              <Pressable onPress={() => setShowQR(false)} className="px-6 py-2.5 rounded-2xl text-sm font-semibold"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                <Text>Fermer</Text></Pressable>
            </Pressable>
          </Pressable>
        )}
      </>

      <View className="flex-1 overflow-y-auto pb-8" style={{  }}>
        {/* Header */}
        <View className="px-5 pt-14 pb-3 flex items-center justify-between">
          <View className="flex items-center gap-3">
            <Pressable onPress={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <ArrowLeft size={17} className="text-white/80" />
            </Pressable>
            <View>
              <Text className="text-lg font-black text-white tracking-tight">Wallet</Text>
              <Text className="text-[11px]" style={{ color: "#10B981" }}>Débrouille Pay</Text>
            </View>
          </View>
          <Pressable onPress={() => setShowQR(true)} className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(16,185,129,0.12)", borderWidth: 1, borderColor: "rgba(16,185,129,0.25)", borderStyle: "solid" }}>
            <QrCode size={16} style={{ color: "#10B981" }} />
          </Pressable>
        </View>

        {/* Virtual Card */}
        <View className="px-5 mb-4">
          <View
            className="relative rounded-3xl p-5 overflow-hidden" style={{ minHeight: 172 }}>
            <View className="absolute top-0 right-0 w-40 h-40 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)", transform: "translate(30%, -30%)" }} />
            <View className="flex items-center justify-between mb-5">
              <View className="flex items-center gap-1.5">
                <Wifi size={16} className="text-white/70" />
                <Text className="text-[11px] text-white/60 font-medium">Débrouille Pay</Text>
              </View>
              <View className="flex items-center gap-1.5">
                <Shield size={13} className="text-green-200/60" />
                <Text className="text-[10px] text-white/50">Sécurisé</Text>
              </View>
            </View>
            <View className="mb-4">
              <Text className="text-[10px] text-white/50 mb-0.5 uppercase tracking-widest">Solde disponible</Text>
              <View className="flex items-center gap-3">
                <>
                  {balanceVisible ? (
                    <Text key="visible" className="text-4xl font-black text-white tracking-tight">
                      {formatAmt(balance)}
                    </Text>
                  ) : (
                    <Text key="hidden" className="text-4xl font-black text-white tracking-widest">
                      <Text>••••••</Text></Text>
                  )}
                </>
                <Pressable onPress={() => setBalanceVisible(v => !v)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  {balanceVisible ? <Eye size={14} className="text-white/80" /> : <EyeOff size={14} className="text-white/80" />}
                </Pressable>
              </View>
            </View>
            <View className="flex items-end justify-between">
              <Text className="text-sm text-white/50 tracking-widest font-mono">**** **** **** ****</Text>
              <View className="text-right">
                <View className="flex items-center gap-1 justify-end">
                  <TrendingDown size={10} className="text-red-300" />
                  <Text className="text-[10px] text-white/50">-{formatAmt(monthOut)} ce mois</Text>
                </View>
                <View className="flex items-center gap-1 justify-end">
                  <TrendingUp size={10} className="text-green-300" />
                  <Text className="text-[10px] text-white/50">+{formatAmt(monthIn)} ce mois</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View className="px-5 mb-5">
          <View className="gap-3">
            {[
              { icon: Send, label: "Envoyer", color: "#10B981", bg: "rgba(16,185,129,0.15)", action: () => setShowSend(true) },
              { icon: Download, label: "Recevoir", color: "#3B82F6", bg: "rgba(59,130,246,0.15)", action: () => setShowQR(true) },
              { icon: RefreshCw, label: "Recharger", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)", action: () => setShowTopUp(true) },
              { icon: History, label: "Historique", color: "#F97316", bg: "rgba(249,115,22,0.15)", action: () => setActiveTab("transactions") },
            ].map(({ icon: Icon, label, color, bg, action }) => (
              <Pressable key={label}
                onPress={action} className="flex flex-col items-center gap-2 py-3.5 rounded-2xl"
                style={{ backgroundColor: bg, borderStyle: "solid" }}>
                <Icon size={18} style={{ color }} />
                <Text className="text-[10px] font-semibold" style={{ color }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View className="px-5 mb-4">
          <View className="flex gap-2 p-1 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            {(["overview", "transactions", "budget"] as const).map(tab => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)}
                className="flex-1 py-2 rounded-xl text-[11px] font-semibold"
                style={{ backgroundColor: activeTab === tab ? "rgba(16,185,129,0.2)" : "transparent", borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}>
                {tab === "overview" ? "Aperçu" : tab === "transactions" ? "Transactions" : "Budget"}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Overview */}
        {activeTab === "overview" && (
          <View key="overview" className="px-5 flex flex-col gap-5">
            <View className="rounded-3xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
              <Text className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest">Activité — 7 derniers jours</Text>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0d0d20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11, color: "white" }} />
                  <Area type="monotone" dataKey="revenus" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                  <Area type="monotone" dataKey="dépenses" stroke="#EF4444" strokeWidth={2} fill="url(#depGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </View>

            <View className="rounded-3xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
              <Text className="text-xs font-bold text-white/50 mb-4 uppercase tracking-widest">Répartition des dépenses</Text>
              <View className="flex items-center gap-4">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={3} stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <View className="flex-1 flex flex-col gap-1.5">
                  {pieData.map(entry => (
                    <View key={entry.name} className="flex items-center justify-between">
                      <View className="flex items-center gap-2">
                        <View className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <Text className="text-[11px] text-white/60">{entry.name}</Text>
                      </View>
                      <Text className="text-[11px] font-bold text-white/80">{formatAmt(entry.value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className="gap-2">
              {[
                { label: "Ce mois", value: formatAmt(monthIn), sub: "Revenus", color: "#10B981", icon: ArrowDownLeft },
                { label: "Ce mois", value: formatAmt(monthOut), sub: "Dépenses", color: "#EF4444", icon: ArrowUpRight },
                { label: "Solde", value: formatAmt(balance), sub: "Disponible", color: "#8B5CF6", icon: TrendingUp },
              ].map(({ label, value, sub, color, icon: Icon }, i) => (
                <View key={sub}
                  className="rounded-2xl p-3 flex flex-col gap-1" style={{ backgroundColor: `${color}10`, borderStyle: "solid" }}>
                  <Icon size={14} style={{ color }} />
                  <Text className="text-base font-black text-white leading-tight">{value}</Text>
                  <Text className="text-[9px] text-white/40 leading-tight">{label} · {sub}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transactions */}
        {activeTab === "transactions" && (
          <View key="transactions" className="px-5">
            <Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            </Text>
            {transactions.length === 0 && (
              <View className="flex flex-col items-center justify-center py-12 gap-3">
                <Wallet size={40} color="#6B7280" />
                <Text className="text-gray-400 text-sm">Aucune transaction pour l'instant</Text>
              </View>
            )}
            <View className="flex flex-col gap-2">
              {transactions.map((tx, i) => {
                const isIn = tx.type === "deposit" || tx.type === "refund" || tx.type === "reward";
                return (
                  <View key={tx._id}
                    className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                    <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isIn ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}>
                      {isIn ? <ArrowDownLeft size={18} color="#10B981" /> : <ArrowUpRight size={18} color="#EF4444" />}
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-bold text-white truncate">{tx.description}</Text>
                      <View className="flex items-center gap-1 mt-0.5">
                        {tx.status === "completed" ? <CheckCircle2 size={10} className="text-green-400" /> : tx.status === "pending" ? <AlertCircle size={10} className="text-yellow-400" /> : <XCircle size={10} className="text-red-400" />}
                        <Text className="text-[10px]" style={{ color: tx.status === "completed" ? "#10B981" : tx.status === "pending" ? "#FBBF24" : "#EF4444" }}>
                          {tx.status === "completed" ? "Complété" : tx.status === "pending" ? "En attente" : "Échoué"}
                        </Text>
                        <Clock size={9} className="text-white/25 ml-1" />
                        <Text className="text-[10px] text-white/35 truncate">
                          {tx.completedAt ? new Date(tx.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-sm font-black flex-shrink-0" style={{ color: isIn ? "#10B981" : "#EF4444" }}>
                      {isIn ? "+" : "-"}{formatAmt(tx.amount, tx.currency)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Budget */}
        {activeTab === "budget" && (
          <View key="budget" className="px-5 flex flex-col gap-4 pb-4">
            <View className="rounded-3xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
              <View className="flex items-center gap-2 mb-3">
                <Target size={14} style={{ color: "#10B981" }} />
                <Text className="text-xs font-bold text-white/50 uppercase tracking-widest">Résumé mensuel</Text>
              </View>
              <View className="flex items-end justify-between mb-3">
                <View>
                  <Text className="text-3xl font-black text-white">{formatAmt(totalSpent)}</Text>
                  <Text className="text-[11px] text-white/40">dépensé sur <Text className="text-white/60 font-bold">{formatAmt(totalBudget)}</Text> budgétisé</Text>
                </View>
                <View className="text-right">
                  <Text className="text-lg font-bold" style={{ color: totalSpent > totalBudget ? "#EF4444" : "#10B981" }}>
                    {formatAmt(Math.max(0, totalBudget - totalSpent))}
                  </Text>
                  <Text className="text-[10px] text-white/30">restants</Text>
                </View>
              </View>
              <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <View className="h-full rounded-full"
                  style={{ backgroundColor: totalSpent / Math.max(totalBudget, 1) >= 0.8 ? "#F97316" : "#10B981" }} />
              </View>
            </View>

            <Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest -mb-1">Par catégorie</Text>
            {categories.map((cat, i) => {
              const pct = Math.min((cat.spent / Math.max(cat.allocated, 1)) * 100, 100);
              const over = cat.spent > cat.allocated;
              const alert = cat.spent / Math.max(cat.allocated, 1) >= 0.8;
              const color = CATEGORY_COLORS[cat.name] ?? "#10B981";
              const Icon = CATEGORY_ICONS[cat.name] ?? MoreHorizontal;
              return (
                <View key={cat.name}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: over ? "rgba(239,68,68,0.06)" : alert ? "rgba(249,115,22,0.06)" : "rgba(255,255,255,0.04)", borderColor: "rgba(239,68,68,0.25)", borderStyle: "solid" }}>
                  <View className="flex items-center justify-between mb-2">
                    <View className="flex items-center gap-2.5">
                      <View className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                        <Icon size={15} style={{ color }} />
                      </View>
                      <View>
                        <Text className="text-sm font-bold text-white">{cat.name}</Text>
                        <Text className="text-[10px] text-white/40">{formatAmt(cat.spent)} / <Text className="text-white/60">{formatAmt(cat.allocated)}</Text></Text>
                      </View>
                    </View>
                    <View className="flex items-center gap-2">
                      {alert && !over && <AlertTriangle size={12} style={{ color: "#F97316" }} />}
                      {over && <Text className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#EF4444" }}>DÉPASSÉ</Text>}
                      {editingCat === cat.name ? (
                        <View className="flex items-center gap-1">
                          <TextInput value={editValue} onChangeText={text => setEditValue(text)}
                            onKeyDown={e => { if (e.key === "Enter") handleEditBudget(cat.name); if (e.key === "Escape") setEditingCat(null); }}
                            className="w-16 text-xs text-white text-right rounded-lg px-2 py-1 outline-none"
                            style={{ backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", borderStyle: "solid" }} autoFocus  keyboardType="numeric"/>
                          <Pressable onPress={() => handleEditBudget(cat.name)} className=""><Check size={13} className="text-green-400" /></Pressable>
                          <Pressable onPress={() => setEditingCat(null)} className=""><X size={13} className="text-red-400" /></Pressable>
                        </View>
                      ) : (
                        <Pressable onPress={() => { setEditingCat(cat.name); setEditValue(String(cat.allocated)); }} className="">
                          <Edit3 size={13} className="text-white/30" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
                    <View
                      className="h-full rounded-full" style={{ backgroundColor: over ? "#EF4444" : alert ? "#F97316" : color }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* TopUp Modal */}
      <>
        {showTopUp && (
          <>
            <Pressable
              onPress={() => setShowTopUp(false)} className="absolute inset-0 z-40" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} />
            <View
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <View className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-5" />
              <View className="flex items-center gap-3 mb-5">
                <View className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,0.2)" }}>
                  <Plus size={20} style={{ color: "#8B5CF6" }} />
                </View>
                <View>
                  <Text className="text-white font-black text-lg">Recharger le Wallet</Text>
                  <Text className="text-white/40 text-xs">Choisissez votre opérateur Mobile Money</Text>
                </View>
              </View>

              {/* Providers */}
              <Text className="text-xs text-white/40 mb-2 uppercase tracking-wider">Opérateur</Text>
              <View className="flex gap-2 mb-5">
                {[
                  { id: "Orange Money", color: "#FF7F00", emoji: "🟠" },
                  { id: "MTN MoMo", color: "#FFC107", emoji: "🟡" },
                  { id: "Wave", color: "#0088FF", emoji: "🌊" },
                  { id: "Airtel Money", color: "#EF4444", emoji: "🔴" },
                ].map((p) => (
                  <Pressable key={p.id} onPress={() => setTopUpProvider(p.id)}
                    className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl"
                    style={{ backgroundColor: topUpProvider === p.id ? `${p.color}20` : "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                    <Text className="text-lg">{p.emoji}</Text>
                    <Text className="text-[9px] font-semibold text-center leading-tight" style={{ color: topUpProvider === p.id ? p.color : "rgba(255,255,255,0.4)" }}>
                      {p.id.split(" ")[0]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Quick amounts */}
              <Text className="text-xs text-white/40 mb-2 uppercase tracking-wider">Montant</Text>
              <View className="gap-2 mb-3">
                {[1000, 2500, 5000, 10000].map(amt => (
                  <Pressable key={amt} onPress={() => setTopUpAmount(String(amt))}
                    className="py-2 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: topUpAmount === String(amt) ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)", borderColor: "rgba(139,92,246,0.4)", borderStyle: "solid" }}>
                    {(amt / 1000).toFixed(0)}<Text>k FC</Text></Pressable>
                ))}
              </View>
              <TextInput
               
                value={topUpAmount}
                onChangeText={text => setTopUpAmount(text)}
                placeholder="Montant personnalisé (FCFA)"
                className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 outline-none mb-4"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               keyboardType="numeric"/>
              <Pressable onPress={() => void handleDeposit()}
                className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-white"
                style={{ opacity: topUpProvider ? 1 : 0.5 }}>
                <Plus size={16} /> <Text>Recharger maintenant</Text></Pressable>
              <Text className="text-[9px] text-white/20 text-center mt-2">
                Simulation de paiement — Aucun débit réel n'est effectué
              </Text>
            </View>
          </>
        )}
      </>

      {/* Send Modal */}
      <>
        {showSend && (
          <View
            className="absolute inset-0 z-40 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <View
              className="w-full max-w-sm rounded-t-3xl p-5" style={{ backgroundColor: "#0d1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-5">
                <Text className="text-base font-bold text-white">Envoyer de l'argent</Text>
                <Pressable onPress={() => setShowSend(false)} className=""><X size={18} className="text-white/60" /></Pressable>
              </View>
              <View className="space-y-3 mb-4">
                <View>
                  <Text className="text-white/40 text-xs mb-1 block">Montant (FCFA)</Text>
                  <TextInput value={sendAmt} onChangeText={text => setSendAmt(text)}
                    placeholder="0" className="w-full px-3 py-2.5 rounded-xl text-white outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}  keyboardType="numeric"/>
                </View>
                <View>
                  <Text className="text-white/40 text-xs mb-1 block">Description</Text>
                  <TextInput value={sendDesc} onChangeText={text => setSendDesc(text)}
                    placeholder="Objet du transfert..." className="w-full px-3 py-2.5 rounded-xl text-white outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} />
                </View>
              </View>
              <Pressable onPress={handleSend} disabled={!sendAmt || !sendDesc}
                className="w-full py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40"
                style={{ backgroundColor: "#10B981" }}>
                <Text>Envoyer</Text></Pressable>
            </View>
          </View>
        )}
      </>
    </View>
  );
}

export default function WalletPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AuthLoading>
        <View className="h-full flex flex-col p-5 gap-4" style={{  }}>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </View>
        </View>
      </AuthLoading>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center gap-4 relative" style={{  }}>
          <Pressable onPress={onBack} className="absolute top-14 left-5 p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={18} color="white" />
          </Pressable>
          <Wallet size={48} color="#6B7280" />
          <Text className="text-gray-400">Connectez-vous pour accéder à votre wallet</Text>
        </View>
      </Unauthenticated>
      <Authenticated>
        <WalletInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
