import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown,
  Utensils, Bed, Plane, Camera, ShoppingBag, AlertTriangle,
  Check, X, ChevronDown, BarChart2, Globe, Wallet,
  ArrowRightLeft, Coffee, Car,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";

type Category = "transport" | "hebergement" | "repas" | "loisirs" | "shopping" | "autre";
type Currency = "EUR" | "USD" | "JPY" | "MAD" | "GBP" | "XOF";

const CATEGORY_CONFIG: Record<Category, { label: string; icon: typeof Utensils; color: string; gradient: string }> = {
  transport:   { label: "Transport",   icon: Plane,       color: "text-blue-400",   gradient: "from-blue-500 to-cyan-500"     },
  hebergement: { label: "Hébergement", icon: Bed,         color: "text-purple-400", gradient: "from-purple-500 to-pink-500"   },
  repas:       { label: "Repas",       icon: Utensils,    color: "text-orange-400", gradient: "from-orange-500 to-yellow-500" },
  loisirs:     { label: "Loisirs",     icon: Camera,      color: "text-green-400",  gradient: "from-green-500 to-teal-500"    },
  shopping:    { label: "Shopping",    icon: ShoppingBag, color: "text-pink-400",   gradient: "from-pink-500 to-rose-500"     },
  autre:       { label: "Autre",       icon: Coffee,      color: "text-gray-400",   gradient: "from-gray-500 to-slate-500"    },
};

const EXCHANGE_RATES: Record<Currency, number> = { EUR: 1, USD: 1.08, JPY: 163, MAD: 10.8, GBP: 0.86, XOF: 655 };
const CURRENCY_SYMBOLS: Record<Currency, string> = { EUR: "€", USD: "$", JPY: "¥", MAD: "MAD", GBP: "£", XOF: "FCFA" };

const COST_OF_LIFE = [
  { city: "Bangkok",   flag: "🇹🇭", daily: 45,  currency: "USD", level: "low"    as const, breakdown: { accommodation: 20, food: 12, transport: 5,  activities: 8  } },
  { city: "Dakar",     flag: "🇸🇳", daily: 55,  currency: "USD", level: "low"    as const, breakdown: { accommodation: 25, food: 18, transport: 6,  activities: 6  } },
  { city: "Marrakech", flag: "🇲🇦", daily: 65,  currency: "USD", level: "medium" as const, breakdown: { accommodation: 30, food: 20, transport: 5,  activities: 10 } },
  { city: "Lisbonne",  flag: "🇵🇹", daily: 90,  currency: "USD", level: "medium" as const, breakdown: { accommodation: 50, food: 22, transport: 8,  activities: 10 } },
  { city: "Tokyo",     flag: "🇯🇵", daily: 130, currency: "USD", level: "high"   as const, breakdown: { accommodation: 70, food: 35, transport: 15, activities: 10 } },
  { city: "Paris",     flag: "🇫🇷", daily: 155, currency: "USD", level: "high"   as const, breakdown: { accommodation: 95, food: 35, transport: 12, activities: 13 } },
];

function toEUR(amount: number, currency: Currency): number { return amount / EXCHANGE_RATES[currency]; }
function formatCurrency(amount: number, currency: Currency): string {
  const sym = CURRENCY_SYMBOLS[currency];
  if (currency === "JPY" || currency === "XOF") return `${Math.round(amount).toLocaleString("fr-FR")} ${sym}`;
  return `${sym}${amount.toFixed(2).replace(".", ",")}`;
}

type Props = { onBack: () => void };

function BudgetInner({ onBack }: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState<Id<"travelPlans"> | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "compare" | "converter">("overview");
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("repas");
  const [newCurrency, setNewCurrency] = useState<Currency>("EUR");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [convertAmount, setConvertAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState<Currency>("EUR");
  const [toCurrency, setToCurrency] = useState<Currency>("JPY");

  const plans = useQuery(api.travel.listMyTravelPlans, {});
  const expenses = useQuery(api.travel.listTravelExpenses, selectedPlanId ? { planId: selectedPlanId } : "skip");
  const addExpense = useMutation(api.travel.addTravelExpense);

  const selectedPlan = plans?.find(p => p._id === selectedPlanId) ?? null;

  const handleAddExpense = async () => {
    if (!selectedPlanId || !newLabel.trim() || !newAmount) return;
    try {
      await addExpense({
        planId: selectedPlanId,
        category: newCategory,
        description: newLabel,
        amount: parseFloat(newAmount),
        currency: newCurrency,
        date: new Date().toISOString().split("T")[0],
      });
      UIService.openToast("Dépense ajoutée !", "success");
      setNewLabel(""); setNewAmount(""); setShowAdd(false);
    } catch {
      UIService.openToast("Erreur lors de l'ajout", "error");
    }
  };

  const convertedAmount = (() => {
    const num = parseFloat(convertAmount) || 0;
    return (num / EXCHANGE_RATES[fromCurrency]) * EXCHANGE_RATES[toCurrency];
  })();

  if (selectedPlan && selectedPlanId) {
    const totalSpent = (expenses ?? []).reduce((a, e) => a + toEUR(e.amount, e.currency as Currency), 0);
    const budget = selectedPlan.totalBudget ?? 0;
    const remaining = budget - totalSpent;
    const pct = budget > 0 ? Math.min(100, (totalSpent / budget) * 100) : 0;
    const isOverBudget = budget > 0 && remaining < 0;

    const spentByCategory: Record<Category, number> = { transport: 0, hebergement: 0, repas: 0, loisirs: 0, shopping: 0, autre: 0 };
    for (const exp of (expenses ?? [])) {
      const cat = (exp.category as Category) in spentByCategory ? (exp.category as Category) : "autre";
      spentByCategory[cat] += toEUR(exp.amount, exp.currency as Currency);
    }

    return (
      <View className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
        <View className="flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
          <Pressable onPress={() => setSelectedPlanId(null)} className="p-2 rounded-xl bg-white/10"><ArrowLeft size={20} /></Pressable>
          <View className="flex-1">
            <Text className="text-lg font-bold">{selectedPlan.destination}</Text>
            <Text className="text-xs text-gray-400">Budget voyage</Text>
          </View>
          <Pressable onPress={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl text-sm font-semibold">
            <Plus size={16} /> <Text>Dépense</Text></Pressable>
        </View>

        {budget > 0 && (
          <View className="mx-4 mb-3 bg-white/5 rounded-2xl p-4 border border-white/10 flex-shrink-0">
            <View className="flex items-end justify-between mb-3">
              <View>
                <Text className="text-xs text-gray-400 mb-1">Dépensé</Text>
                <Text className="text-3xl font-bold">{formatCurrency(totalSpent, (selectedPlan.currency as Currency) ?? "EUR")}</Text>
              </View>
              <View className="text-right">
                <Text className="text-xs text-gray-400 mb-1">{isOverBudget ? "Dépassement" : "Restant"}</Text>
                <Text className={`text-xl font-bold ${isOverBudget ? "text-red-400" : "text-green-400"}`}>
                  {isOverBudget ? "+" : ""}{formatCurrency(Math.abs(remaining), (selectedPlan.currency as Currency) ?? "EUR")}
                </Text>
              </View>
            </View>
            <View className="h-3 bg-white/10 rounded-full overflow-hidden">
              <View className={`h-full rounded-full ${isOverBudget ? "bg-red-500" : pct > 80 ? "bg-orange-500" : "bg-gradient-to-r from-green-500 to-teal-500"}`} />
            </View>
            <View className="flex justify-between mt-1">
              <Text className="text-xs text-gray-500">0</Text>
              <Text className="text-xs text-gray-400">{Math.round(pct)}% utilisé</Text>
              <Text className="text-xs text-gray-500">{formatCurrency(budget, (selectedPlan.currency as Currency) ?? "EUR")}</Text>
            </View>
            {isOverBudget && <View className="flex items-center gap-2 mt-3 p-2 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300"><AlertTriangle size={14} /> <Text>Budget dépassé</Text></View>}
          </View>
        )}

        <View className="flex bg-gray-900/60 mx-4 rounded-xl p-1 mb-3 flex-shrink-0">
          {([{ key: "expenses", label: "Dépenses" }, { key: "overview", label: "Catégories" }] as const).map(t => (
            <Pressable key={t.key} onPress={() => setActiveTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === t.key ? "bg-white/15 text-white" : "text-gray-400"}`}>
              {t.label}
            </Pressable>
          ))}
        </View>

        <View className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
          {activeTab === "overview" && (
            <>
              {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat, i) => {
                const cfg = CATEGORY_CONFIG[cat];
                const spent = spentByCategory[cat];
                return (
                  <View key={cat}
                    className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <View className="flex items-center gap-3 mb-2">
                      <View className={`p-2 rounded-xl bg-gradient-to-br ${cfg.gradient} bg-opacity-20`}><cfg.icon size={16} className="text-white" /></View>
                      <View className="flex-1">
                        <View className="flex items-center justify-between">
                          <Text className="text-sm font-semibold">{cfg.label}</Text>
                          <Text className={`text-xs font-bold ${cfg.color}`}>{formatCurrency(spent, "EUR")}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {activeTab === "expenses" && (
            <>
              {!expenses && <View className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</View>}
              {expenses?.length === 0 && (
                <View className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Wallet size={40} className="mb-3 opacity-40" />
                  <Text className="text-sm">Aucune dépense enregistrée</Text>
                </View>
              )}
              {expenses?.map((exp, i) => {
                const cat = (exp.category as Category) in CATEGORY_CONFIG ? (exp.category as Category) : "autre";
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <View key={exp._id}
                    className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                    <View className={`p-2.5 rounded-xl bg-gradient-to-br ${cfg.gradient} opacity-80`}><cfg.icon size={15} className="text-white" /></View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-medium truncate">{exp.description}</Text>
                      <Text className="text-xs text-gray-400">{cfg.label} · {new Date(exp.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</Text>
                    </View>
                    <View className="text-right flex-shrink-0">
                      <Text className="text-sm font-bold">{formatCurrency(exp.amount, exp.currency as Currency)}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>

        <>
          {showAdd && (
            <Pressable
              className="absolute inset-0 bg-black/70 flex items-end z-50" onPress={() => setShowAdd(false)}>
              <Pressable
                onPress={e => e.stopPropagation()} className="w-full bg-gray-900 rounded-t-3xl p-6 pb-10 space-y-4">
                <View className="w-12 h-1 bg-white/20 rounded-full mx-auto" />
                <View className="flex items-center justify-between">
                  <Text className="text-lg font-bold">Nouvelle dépense</Text>
                  <Pressable onPress={() => setShowAdd(false)} className="p-2 rounded-xl bg-white/10"><X size={16} /></Pressable>
                </View>
                <TextInput value={newLabel} onChangeText={text => setNewLabel(text)}
                  className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none text-sm" placeholder="Description (ex: Dîner restaurant)" />
                <View className="flex gap-3">
                  <TextInput value={newAmount} onChangeText={text => setNewAmount(text)}
                    className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none text-sm" placeholder="Montant"  keyboardType="numeric"/>
                  <Pressable onPress={() => setShowCurrencyPicker(p => !p)}
                    className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3 text-sm font-medium">
                    {newCurrency} <ChevronDown size={14} />
                  </Pressable>
                </View>
                <AnimatePresence>
                  {showCurrencyPicker && (
                    <View className="gap-2">
                      {(Object.keys(CURRENCY_SYMBOLS) as Currency[]).map(c => (
                        <Pressable key={c} onPress={() => { setNewCurrency(c); setShowCurrencyPicker(false); }}
                          className={`py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${newCurrency === c ? "bg-blue-500/30 border border-blue-500/50 text-blue-300" : "bg-white/10 hover:bg-white/20"}`}>
                          {c} {CURRENCY_SYMBOLS[c]}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </AnimatePresence>
                <View>
                  <Text className="text-xs text-gray-400 mb-2">Catégorie</Text>
                  <View className="gap-2">
                    {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const sel = newCategory === cat;
                      return (
                        <Pressable key={cat} onPress={() => setNewCategory(cat)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs transition-all cursor-pointer ${sel ? `bg-gradient-to-br ${cfg.gradient} bg-opacity-20 border-white/30 text-white` : "bg-white/5 border-white/10 text-gray-400"}`}>
                          <cfg.icon size={16} />{cfg.label}{sel && <Check size={10} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <Pressable onPress={handleAddExpense} disabled={!newLabel.trim() || !newAmount}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                  <Text>Enregistrer la dépense</Text></Pressable>
              </Pressable>
            </Pressable>
          )}
        </>
      </View>
    );
  }

  // Main view — list of travel budgets
  return (
    <View className="h-full flex flex-col bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <View className="flex items-center gap-3 px-4 pt-12 pb-3 flex-shrink-0">
        <Pressable onPress={onBack} className="p-2 rounded-xl bg-white/10"><ArrowLeft size={20} /></Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold">Budget Voyage</Text>
          <Text className="text-xs text-gray-400">{plans?.length ?? 0} voyages suivis</Text>
        </View>
      </View>

      <View className="flex bg-gray-900/60 mx-4 rounded-xl p-1 mb-3 flex-shrink-0">
        {([
          { key: "overview", label: "Mes Voyages", icon: Wallet },
          { key: "compare",  label: "Coût de vie", icon: Globe  },
          { key: "converter", label: "Convertisseur", icon: ArrowRightLeft },
        ] as const).map(t => (
          <Pressable key={t.key} onPress={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === t.key ? "bg-white/15 text-white" : "text-gray-400"}`}>
            <t.icon size={12} /> {t.label}
          </Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-8 space-y-3">
        {activeTab === "overview" && (
          <>
            {!plans && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            {plans?.length === 0 && (
              <View className="flex flex-col items-center py-16 gap-3 text-gray-400">
                <Wallet size={40} className="opacity-30" />
                <Text className="text-sm">Aucun voyage. Créez-en un dans le Planificateur.</Text>
              </View>
            )}
            {plans?.map((plan, i) => (
              <Pressable key={plan._id}
                onPress={() => { setSelectedPlanId(plan._id); setActiveTab("expenses"); }}
                className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 text-left">
                <View className="flex items-center gap-3 mb-3">
                  <View className="p-2.5 bg-blue-500/20 rounded-xl"><Globe size={18} className="text-blue-400" /></View>
                  <View className="flex-1">
                    <Text className="font-semibold">{plan.destination}</Text>
                    <Text className="text-xs text-gray-400">{plan.expensesTotal.toFixed(0)} {plan.currency ?? "EUR"} dépensé{plan.totalBudget ? ` / ${plan.totalBudget} ${plan.currency ?? "EUR"}` : ""}</Text>
                  </View>
                  {plan.totalBudget && plan.expensesTotal > plan.totalBudget && (
                    <Text className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> Dépassement</Text>
                  )}
                </View>
                {plan.totalBudget && (
                  <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className={`h-full rounded-full ${plan.expensesTotal > plan.totalBudget ? "bg-red-500" : (plan.expensesTotal / plan.totalBudget) > 0.8 ? "bg-orange-500" : "bg-gradient-to-r from-green-500 to-teal-500"}`}
                    />
                  </View>
                )}
              </Pressable>
            ))}
          </>
        )}

        {activeTab === "compare" && (
          <>
            <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <Text className="text-sm font-semibold flex items-center gap-2 mb-1"><BarChart2 size={16} className="text-cyan-400" /> Coût de vie estimé / jour</Text>
              <Text className="text-xs text-gray-400">Budget backpacker moyen</Text>
            </View>
            {COST_OF_LIFE.map((city, i) => {
              const levelColor = city.level === "low" ? "text-green-400" : city.level === "medium" ? "text-yellow-400" : "text-red-400";
              const levelBg = city.level === "low" ? "bg-green-500/20 border-green-500/30" : city.level === "medium" ? "bg-yellow-500/20 border-yellow-500/30" : "bg-red-500/20 border-red-500/30";
              return (
                <View key={city.city}
                  className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <View className="flex items-center gap-3 mb-2">
                    <Text className="text-xl">{city.flag}</Text>
                    <View className="flex-1">
                      <View className="flex items-center justify-between">
                        <Text className="font-semibold text-sm">{city.city}</Text>
                        <Text className={`text-xs px-2 py-0.5 rounded-full border ${levelBg} ${levelColor} font-medium`}>
                          {city.level === "low" ? "Économique" : city.level === "medium" ? "Moyen" : "Élevé"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex items-center gap-3 mb-2">
                    <View className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <View className={`h-full rounded-full ${city.level === "low" ? "bg-green-500" : city.level === "medium" ? "bg-yellow-500" : "bg-red-500"}`} />
                    </View>
                    <Text className={`text-sm font-bold flex-shrink-0 ${levelColor}`}>${city.daily}/jour</Text>
                  </View>
                  <View className="gap-1">
                    {[
                      { icon: Bed, label: "Hébergement", val: city.breakdown.accommodation },
                      { icon: Utensils, label: "Repas", val: city.breakdown.food },
                      { icon: Car, label: "Transport", val: city.breakdown.transport },
                      { icon: Camera, label: "Activités", val: city.breakdown.activities },
                    ].map(item => (
                      <View key={item.label} className="bg-white/5 rounded-lg p-2 text-center">
                        <item.icon size={12} className="mx-auto text-gray-400 mb-1" />
                        <Text className="text-xs font-bold">${item.val}</Text>
                        <Text className="text-[9px] text-gray-500 leading-tight">{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === "converter" && (
          <View className="space-y-4">
            <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <Text className="text-sm font-semibold flex items-center gap-2 mb-4"><ArrowRightLeft size={16} className="text-blue-400" /> Convertisseur de devises</Text>
              <View className="space-y-3">
                <View>
                  <Text className="text-xs text-gray-400 mb-1 block">Montant</Text>
                  <TextInput value={convertAmount} onChangeText={text => setConvertAmount(text)}
                    className="w-full bg-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none"  keyboardType="numeric"/>
                </View>
                <View className="gap-3">
                  <View>
                    <Text className="text-xs text-gray-400 mb-1 block">De</Text>
                    <Picker onValueChange={val => setFromCurrency(val as Currency)}
                      className="w-full bg-white/10 rounded-xl px-4 py-3 text-white outline-none text-sm" selectedValue={fromCurrency}>
                      {(Object.keys(CURRENCY_SYMBOLS) as Currency[]).map(c => <Picker.Item label={`${c}— ${CURRENCY_SYMBOLS[c]}`} value={c} />)}
                    </Picker>
                  </View>
                  <View>
                    <Text className="text-xs text-gray-400 mb-1 block">Vers</Text>
                    <Picker onValueChange={val => setToCurrency(val as Currency)}
                      className="w-full bg-white/10 rounded-xl px-4 py-3 text-white outline-none text-sm" selectedValue={toCurrency}>
                      {(Object.keys(CURRENCY_SYMBOLS) as Currency[]).map(c => <Picker.Item label={`${c}— ${CURRENCY_SYMBOLS[c]}`} value={c} />)}
                    </Picker>
                  </View>
                </View>
                <View className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-4 text-center">
                  <Text className="text-xs text-gray-400 mb-1">{convertAmount || 0} {fromCurrency} =</Text>
                  <Text className="text-3xl font-bold text-white">
                    {toCurrency === "JPY" || toCurrency === "XOF" ? Math.round(convertedAmount).toLocaleString("fr-FR") : convertedAmount.toFixed(2)} {CURRENCY_SYMBOLS[toCurrency]}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">Taux : 1 {fromCurrency} = {(EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency]).toFixed(4)} {toCurrency}</Text>
                </View>
              </View>
            </View>
            <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <Text className="text-sm font-semibold mb-3">Taux vs Euro</Text>
              <View className="space-y-2">
                {(Object.keys(EXCHANGE_RATES) as Currency[]).map(c => (
                  <View key={c} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <Text className="text-sm font-medium">{c}</Text>
                    <Text className="text-sm text-gray-300">{CURRENCY_SYMBOLS[c]}</Text>
                    <Text className="text-sm font-bold text-blue-300"><Text>1€ =</Text>{EXCHANGE_RATES[c] >= 10 ? EXCHANGE_RATES[c].toLocaleString("fr-FR") : EXCHANGE_RATES[c].toFixed(2)} {c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export default function BudgetVoyagePage({ onBack }: Props) {
  return (
    <>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center bg-gray-950 text-white gap-4 px-6">
          <DollarSign size={40} className="text-white/20" />
          <Text className="text-center text-gray-400 text-sm">Connectez-vous pour suivre vos budgets voyage</Text>
          <Pressable onPress={onBack} className="flex items-center gap-2 text-sm text-gray-400"><ArrowLeft size={16} /> Retour</Pressable>
        </View>
      </Unauthenticated>
      <AuthLoading>
        <View className="h-full flex flex-col bg-gray-950 px-4 pt-12 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </View>
      </AuthLoading>
      <Authenticated>
        <BudgetInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
