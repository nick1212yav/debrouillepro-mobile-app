import { View, Pressable, Text, TextInput } from "react-native";
import { useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Target, Plus, ChevronRight, Star, BarChart2, Wallet, RefreshCw, Trash2, X, Check } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const TABS = ["Portefeuille", "Épargne", "Simuler"];

function formatFCFA(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M FCFA";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + "k FCFA";
  return n.toLocaleString("fr-FR") + " FCFA";
}

const SECTOR_COLORS: Record<string, string> = {
  Télécom: "#F97316", Finance: "#6366F1", Énergie: "#FBBF24",
  Technologie: "#10B981", Agriculture: "#84CC16", Autre: "#8B5CF6",
};

type AddAssetForm = {
  symbol: string; name: string; sector: string;
  quantity: string; buyPrice: string; currentPrice: string;
};

type AddGoalForm = {
  name: string; targetAmount: string; currentAmount: string;
  monthlyContribution: string; color: string;
};

function FinancesInner({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Portefeuille");
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [assetForm, setAssetForm] = useState<AddAssetForm>({ symbol: "", name: "", sector: "Finance", quantity: "", buyPrice: "", currentPrice: "" });
  const [goalForm, setGoalForm] = useState<AddGoalForm>({ name: "", targetAmount: "", currentAmount: "0", monthlyContribution: "", color: "#6366F1" });

  // Simulator state
  const [simAmount, setSimAmount] = useState("100000");
  const [simRate, setSimRate] = useState("8");
  const [simYears, setSimYears] = useState("5");
  const simResult = parseFloat(simAmount || "0") * Math.pow(1 + parseFloat(simRate || "0") / 100, parseFloat(simYears || "0"));

  const assets = useQuery(api.finances.getMyInvestmentAssets, {}) ?? [];
  const goals = useQuery(api.finances.getMySavingsGoals, {}) ?? [];

  const upsertAsset = useMutation(api.finances.upsertInvestmentAsset);
  const deleteAsset = useMutation(api.finances.deleteInvestmentAsset);
  const upsertGoal = useMutation(api.finances.upsertSavingsGoal);
  const deleteGoal = useMutation(api.finances.deleteSavingsGoal);
  const contributeGoal = useMutation(api.finances.contributeSavingsGoal);

  const totalPortfolio = assets.reduce((sum, a) => sum + a.currentPrice * a.quantity, 0);
  const totalGain = assets.reduce((sum, a) => sum + (a.currentPrice - a.buyPrice) * a.quantity, 0);
  const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  async function handleAddAsset() {
    try {
      await upsertAsset({
        symbol: assetForm.symbol.toUpperCase(),
        name: assetForm.name,
        sector: assetForm.sector,
        quantity: parseFloat(assetForm.quantity) || 0,
        buyPrice: parseFloat(assetForm.buyPrice) || 0,
        currentPrice: parseFloat(assetForm.currentPrice) || 0,
        currency: "XAF",
        changePercent: assetForm.buyPrice
          ? ((parseFloat(assetForm.currentPrice) - parseFloat(assetForm.buyPrice)) / parseFloat(assetForm.buyPrice)) * 100
          : 0,
      });
      setShowAddAsset(false);
      setAssetForm({ symbol: "", name: "", sector: "Finance", quantity: "", buyPrice: "", currentPrice: "" });
      toast.success("Actif ajouté !");
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  }

  async function handleAddGoal() {
    try {
      await upsertGoal({
        name: goalForm.name,
        targetAmount: parseFloat(goalForm.targetAmount) || 0,
        currentAmount: parseFloat(goalForm.currentAmount) || 0,
        monthlyContribution: parseFloat(goalForm.monthlyContribution) || 0,
        currency: "XAF",
        color: goalForm.color,
      });
      setShowAddGoal(false);
      setGoalForm({ name: "", targetAmount: "", currentAmount: "0", monthlyContribution: "", color: "#6366F1" });
      toast.success("Objectif créé !");
    } catch {
      toast.error("Erreur lors de la création");
    }
  }

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>{}<View className="flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex-1"><Text className="text-white font-bold text-lg">Finances+</Text><Text className="text-gray-400 text-xs">Investir · Épargner · Croître</Text></View></View>{}<View className="flex gap-3 px-4 mb-4"><View className="flex-1 p-3 rounded-2xl" style={{ borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}><Text className="text-gray-400 text-xs mb-1">Portefeuille</Text><Text className="text-white font-bold text-base">{formatFCFA(totalPortfolio)}</Text><View className="flex items-center gap-1 mt-0.5">{totalGain >= 0 ? <TrendingUp size={10} color="#10B981" /> : <TrendingDown size={10} color="#EF4444" />}<Text className="text-xs" style={{ color: totalGain >= 0 ? "#10B981" : "#EF4444" }}>{totalGain >= 0 ? "+" : ""}{formatFCFA(Math.round(totalGain))}</Text></View></View><View className="flex-1 p-3 rounded-2xl" style={{ borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}><Text className="text-gray-400 text-xs mb-1">Épargne totale</Text><Text className="text-white font-bold text-base">{formatFCFA(totalSavings)}</Text><View className="flex items-center gap-1 mt-0.5"><Target size={10} color="#6366F1" /><Text className="text-xs" style={{ color: "#6366F1" }}>{goals.length}objectif{goals.length > 1 ? "s" : ""}</Text></View></View></View>{}<View className="flex gap-1 mx-4 mb-4 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>{TABS.map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium transition-all" style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent" }}>{tab}</Pressable>
        ))}</View><View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">{}{activeTab === "Portefeuille" && (
          <>
            {assets.length > 0 && (
              <View className="gap-3"><View className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><BarChart2 size={16} color="#6366F1" className="mx-auto mb-1" /><Text className="text-white font-bold text-sm">{assets.length}actif{assets.length > 1 ? "s" : ""}</Text><Text className="text-gray-500 text-xs">Diversification</Text></View><View className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><RefreshCw size={16} color="#10B981" className="mx-auto mb-1" /><Text className="text-white font-bold text-sm">{totalPortfolio > 0 ? (totalGain >= 0 ? "+" : "") + (totalGain / totalPortfolio * 100).toFixed(1) + "%" : "—"}</Text><Text className="text-gray-500 text-xs">Rendement global</Text></View></View>
            )}
            {assets.length === 0 && (
              <View className="flex flex-col items-center justify-center py-8 gap-3"><DollarSign size={40} color="#6B7280" /><Text className="text-gray-400 text-sm">Aucun actif dans votre portefeuille</Text><Text className="text-gray-600 text-xs">Ajoutez vos premiers investissements</Text></View>
            )}
            {assets.map((asset, i) => {
              const color = SECTOR_COLORS[asset.sector] ?? "#8B5CF6";
              return (
                <View key={asset._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <View className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${color}20`, color }}>{asset.symbol.slice(0, 2)}</View>
                  <View className="flex-1"><Text className="text-white font-semibold text-sm">{asset.name}</Text><Text className="text-gray-400 text-xs">{asset.quantity}actions · {asset.sector}</Text></View>
                  <View className="text-right"><Text className="text-white font-bold text-sm">{formatFCFA(asset.currentPrice)}</Text><View className="flex items-center gap-1 justify-end">{asset.changePercent >= 0 ? <TrendingUp size={10} color="#10B981" /> : <TrendingDown size={10} color="#EF4444" />}<Text className="text-xs" style={{ color: asset.changePercent >= 0 ? "#10B981" : "#EF4444" }}>{asset.changePercent > 0 ? "+" : ""}{asset.changePercent.toFixed(1)}%
                      </Text></View></View>
                  <Pressable onPress={() => { deleteAsset({ assetId: asset._id as Id<"investmentAssets"> }).catch(() => toast.error("Erreur")); }} className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}><Trash2 size={13} color="#EF4444" /></Pressable>
                </View>
              );
            })}
            <Pressable onPress={() => setShowAddAsset(true)} className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}><Plus size={16} /><Text>Ajouter un actif</Text></Pressable>
          </>
        )}{}{activeTab === "Épargne" && (
          <>
            {goals.length === 0 && (
              <View className="flex flex-col items-center justify-center py-8 gap-3"><Target size={40} color="#6B7280" /><Text className="text-gray-400 text-sm">Aucun objectif d'épargne</Text></View>
            )}
            {goals.map((plan, i) => {
              const pct = plan.targetAmount > 0 ? Math.round(plan.currentAmount / plan.targetAmount * 100) : 0;
              const color = plan.color ?? "#6366F1";
              return (
                <View key={plan._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <View className="flex items-center justify-between mb-2"><Text className="text-white font-semibold text-sm">{plan.name}</Text><View className="flex items-center gap-2"><Text className="text-xs font-bold" style={{ color }}>{pct}%</Text><Pressable onPress={() => contributeGoal({ goalId: plan._id as Id<"savingsGoals">, amount: plan.monthlyContribution }).catch(() => toast.error("Erreur"))} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}><Text>+</Text>{(plan.monthlyContribution / 1000).toFixed(0)}<Text>k</Text></Pressable><Pressable onPress={() => deleteGoal({ goalId: plan._id as Id<"savingsGoals"> }).catch(() => toast.error("Erreur"))} className="p-0.5 rounded" style={{  }}><X size={12} /></Pressable></View></View>
                  <View className="w-full h-2 rounded-full mb-2" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} /></View>
                  <View className="flex items-center justify-between"><Text className="text-gray-400 text-xs">{formatFCFA(plan.currentAmount)}</Text><Text className="text-gray-500 text-xs">/ {formatFCFA(plan.targetAmount)}</Text></View>
                  <View className="mt-2 flex items-center gap-2"><Wallet size={12} color={color} /><Text className="text-xs text-gray-400">+{formatFCFA(plan.monthlyContribution)}/mois</Text></View>
                </View>
              );
            })}
            <Pressable onPress={() => setShowAddGoal(true)} className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{ backgroundColor: "rgba(99,102,241,0.15)", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)", borderStyle: "solid" }}><Plus size={16} /><Text>Créer un plan d'épargne</Text></Pressable>
          </>
        )}{}{activeTab === "Simuler" && (
          <View className="space-y-4"><View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-white font-bold mb-4">Simulateur d'investissement</Text><View className="space-y-3"><View><Text className="text-gray-400 text-xs mb-1 block">Montant initial (FCFA)</Text><TextInput value={simAmount} onChangeText={value => setSimAmount(value)} className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} keyboardType="numeric" /></View><View><Text className="text-gray-400 text-xs mb-1 block">Taux annuel (%)</Text><TextInput value={simRate} onChangeText={value => setSimRate(value)} className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} keyboardType="numeric" /></View><View><Text className="text-gray-400 text-xs mb-1 block">Durée (années)</Text><TextInput value={simYears} onChangeText={value => setSimYears(value)} className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} keyboardType="numeric" /></View></View></View><View className="p-4 rounded-2xl text-center" style={{ borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}><Text className="text-gray-400 text-xs mb-2">Valeur finale estimée</Text><Text className="text-white font-bold text-2xl">{formatFCFA(Math.round(simResult))}</Text><Text className="text-green-400 text-sm mt-1">Gain: {formatFCFA(Math.round(simResult - parseFloat(simAmount || "0")))}</Text><View className="flex items-center justify-center gap-1 mt-2"><Star size={12} color="#F59E0B" fill="#F59E0B" /><Text className="text-yellow-400 text-xs">Rendement composé annuellement</Text></View></View></View>
        )}</View>{}{showAddAsset && (
        <View className="absolute inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}><View className="w-full max-w-sm rounded-t-3xl p-5" style={{ backgroundColor: "#0d1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold">Ajouter un actif</Text><Pressable onPress={() => setShowAddAsset(false)} className=""><X size={18} color="#9CA3AF" /></Pressable></View><View className="space-y-3">{(["symbol", "name", "sector", "quantity", "buyPrice", "currentPrice"] as const).map(field => (
                <View key={field}><Text className="text-gray-400 text-xs mb-1 block capitalize">{field === "buyPrice" ? "Prix d'achat (FCFA)" : field === "currentPrice" ? "Prix actuel (FCFA)" : field === "symbol" ? "Symbole" : field === "name" ? "Nom" : field === "sector" ? "Secteur" : "Quantité"}</Text><TextInput value={assetForm[field]} onChangeText={value => setAssetForm(prev => ({ ...prev, [field]: value }))} className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} /></View>
              ))}</View><Pressable onPress={handleAddAsset} className="w-full mt-4 py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: "#10B981" }}><Text>Ajouter</Text></Pressable></View></View>
      )}{}{showAddGoal && (
        <View className="absolute inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}><View className="w-full max-w-sm rounded-t-3xl p-5" style={{ backgroundColor: "#0d1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold">Nouvel objectif d'épargne</Text><Pressable onPress={() => setShowAddGoal(false)} className=""><X size={18} color="#9CA3AF" /></Pressable></View><View className="space-y-3">{[
                { key: "name" as const, label: "Nom de l'objectif", type: "text" },
                { key: "targetAmount" as const, label: "Montant cible (FCFA)", type: "number" },
                { key: "currentAmount" as const, label: "Montant actuel (FCFA)", type: "number" },
                { key: "monthlyContribution" as const, label: "Contribution mensuelle (FCFA)", type: "number" },
              ].map(({ key, label, type }) => (
                <View key={key}><Text className="text-gray-400 text-xs mb-1 block">{label}</Text><TextInput value={goalForm[key]} onChangeText={value => setGoalForm(prev => ({ ...prev, [key]: value }))} className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} /></View>
              ))}<View><Text className="text-gray-400 text-xs mb-1 block">Couleur</Text><View className="flex gap-2">{["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"].map(c => (
                    <Pressable key={c} onPress={() => setGoalForm(prev => ({ ...prev, color: c }))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: c, borderColor: "white", borderStyle: "solid" }}>
                      {goalForm.color === c && <Check size={14} color="white" />}
                    </Pressable>
                  ))}</View></View></View><Pressable onPress={handleAddGoal} className="w-full mt-4 py-3 rounded-xl font-bold text-sm" style={{ backgroundColor: "#6366F1" }}>Créer l'objectif
            </Pressable></View></View>
      )}</View>
  );
}

export default function FinancesPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AuthLoading>
        <View className="h-full flex flex-col p-4 gap-3" style={{  }}>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </View>
      </AuthLoading>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center gap-4" style={{  }}>
          <Pressable onPress={onBack} className="absolute top-12 left-4 p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={18} color="white" />
          </Pressable>
          <DollarSign size={48} color="#6B7280" />
          <Text className="text-gray-400">Connectez-vous pour accéder à vos finances</Text>
        </View>
      </Unauthenticated>
      <Authenticated>
        <FinancesInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
