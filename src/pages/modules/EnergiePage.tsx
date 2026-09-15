import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { ArrowLeft, Zap, Sun, Battery, TrendingDown, MapPin, BarChart2, Leaf, DollarSign, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";

const ENERGY_SOURCES = [
  { name: "Panneau solaire principal", type: "Solaire", production: 4.2, unit: "kWh/jour", status: "Actif", efficiency: 87, color: "#FBBF24" },
  { name: "Réseau CIE", type: "Réseau", production: 0, unit: "kWh/jour", status: "En attente", efficiency: 100, color: "#6366F1" },
  { name: "Batterie stockage", type: "Stockage", production: 12, unit: "kWh stock.", status: "Chargée à 78%", efficiency: 78, color: "#10B981" },
];

const CONSUMPTION_DATA = [
  { label: "Climatiseur", kwh: 5.2, cost: 1560, percent: 35, color: "#EF4444" },
  { label: "Réfrigérateur", kwh: 2.8, cost: 840, percent: 19, color: "#F97316" },
  { label: "Éclairage", kwh: 1.5, cost: 450, percent: 10, color: "#FBBF24" },
  { label: "Télévision", kwh: 1.2, cost: 360, percent: 8, color: "#6366F1" },
  { label: "Autres", kwh: 4.2, cost: 1260, percent: 28, color: "#8B5CF6" },
];

const PROVIDERS = [
  { name: "CIE", type: "Électricité nationale", tariff: "300 FCFA/kWh", coverage: "National", reliability: 72, contact: "25 20 26 00" },
  { name: "SolarAfrica CI", type: "Solaire résidentiel", tariff: "À partir de 800K FCFA", coverage: "Abidjan + villes", reliability: 95, contact: "07 00 00 01" },
  { name: "GreenPower CI", type: "Kits solaires", tariff: "À partir de 200K FCFA", coverage: "National (kit)", reliability: 90, contact: "05 00 00 02" },
];

const ALERTS = [
  { type: "warning", msg: "Consommation +18% vs mois dernier", time: "Aujourd'hui" },
  { type: "success", msg: "Panneau solaire: performance optimale", time: "Il y a 2h" },
  { type: "info", msg: "Délestage prévu: Zone 3 – 14h-16h", time: "Il y a 3h" },
];

function EnergieSettings() {
  const settings = useQuery(api.urban.getEnergySettings);
  const saveSettings = useMutation(api.urban.saveEnergySettings);

  const autoSave = settings?.autoSave ?? true;
  const solarAlerts = settings?.solarAlerts ?? true;

  const toggle = async (field: "autoSave" | "solarAlerts") => {
    try {
      await saveSettings({
        autoSave: field === "autoSave" ? !autoSave : autoSave,
        solarAlerts: field === "solarAlerts" ? !solarAlerts : solarAlerts,
      });
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  return (
    <>
      {[
        { label: "Mode économie auto", desc: "Réduit la consommation aux heures de pointe", val: autoSave, field: "autoSave" as const },
        { label: "Alertes solaires", desc: "Notifications en cas de baisse de production", val: solarAlerts, field: "solarAlerts" as const },
      ].map(({ label, desc, val, field }) => (
        <View key={label} className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex-1"><Text className="text-white font-semibold text-sm">{label}</Text><Text className="text-gray-400 text-xs">{desc}</Text></View><Pressable onPress={() => { void toggle(field); }} className="w-12 h-6 rounded-full transition-all relative" style={{ backgroundColor: val ? "#FBBF24" : "rgba(255,255,255,0.1)" }}><View className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: val ? "calc(100% - 20px)" : "4px" }} /></Pressable></View>
      ))}
    </>
  );
}

export default function EnergiePage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Tableau de bord");

  const totalConsumption = CONSUMPTION_DATA.reduce((s, c) => s + c.kwh, 0);
  const totalCost = CONSUMPTION_DATA.reduce((s, c) => s + c.cost, 0);
  const solarProduction = 4.2;
  const savings = solarProduction * 300;

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}><View className="flex items-center gap-3 px-4 pt-12 pb-4"><Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} color="white" /></Pressable><View className="flex-1"><Text className="text-white font-bold text-lg">Énergie & Solaire</Text><Text className="text-gray-400 text-xs">Gérez votre consommation</Text></View><Pressable className="p-2 rounded-full" style={{ backgroundColor: "rgba(251,191,36,0.15)" }}><RefreshCw size={16} color="#FBBF24" /></Pressable></View><View className="flex gap-3 px-4 mb-4"><View className="flex-1 p-3 rounded-2xl" style={{ borderWidth: 1, borderColor: "rgba(251,191,36,0.3)", borderStyle: "solid" }}><View className="flex items-center gap-1 mb-1"><Sun size={12} color="#FBBF24" /><Text className="text-gray-400 text-xs">Production</Text></View><Text className="text-white font-bold text-base">{solarProduction}kWh</Text><Text className="text-yellow-400 text-xs">{"Aujourd'hui"}</Text></View><View className="flex-1 p-3 rounded-2xl" style={{ borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderStyle: "solid" }}><View className="flex items-center gap-1 mb-1"><Zap size={12} color="#EF4444" /><Text className="text-gray-400 text-xs">Consommation</Text></View><Text className="text-white font-bold text-base">{totalConsumption.toFixed(1)}kWh</Text><Text className="text-red-400 text-xs">Ce jour</Text></View><View className="flex-1 p-3 rounded-2xl" style={{ borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}><View className="flex items-center gap-1 mb-1"><Leaf size={12} color="#10B981" /><Text className="text-gray-400 text-xs">Économies</Text></View><Text className="text-white font-bold text-base">{savings.toLocaleString()}</Text><Text className="text-green-400 text-xs">FCFA/mois</Text></View></View><View className="flex gap-1 mx-4 mb-4 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>{["Tableau de bord", "Consommation", "Fournisseurs"].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent" }}>{tab}</Pressable>
        ))}</View><View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">{activeTab === "Tableau de bord" && (
          <>
            {ALERTS.map((a, i) => (
              <View key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: a.type === "warning" ? "rgba(245,158,11,0.08)" : a.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(99,102,241,0.08)", borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}>{a.type === "warning" ? <AlertTriangle size={14} color="#F59E0B" /> : a.type === "success" ? <CheckCircle size={14} color="#10B981" /> : <Zap size={14} color="#6366F1" />}<View className="flex-1"><Text className="text-white text-xs">{a.msg}</Text><Text className="text-gray-500 text-xs">{a.time}</Text></View></View>
            ))}
            <Text className="text-white font-semibold text-sm">{"Sources d'énergie"}</Text>
            {ENERGY_SOURCES.map((s, i) => (
              <View key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex items-center justify-between mb-2"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${s.color}20` }}>{s.type === "Solaire" ? <Sun size={14} color={s.color} /> : s.type === "Stockage" ? <Battery size={14} color={s.color} /> : <Zap size={14} color={s.color} />}</View><View><Text className="text-white font-semibold text-sm">{s.name}</Text><Text className="text-gray-400 text-xs">{s.status}</Text></View></View><Text className="text-white font-bold text-sm">{s.production}{s.unit}</Text></View>
                <View className="w-full h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View className="h-full rounded-full" style={{ width: `${s.efficiency}%`, backgroundColor: s.color }} /></View>
                <Text className="text-gray-500 text-xs mt-1">{s.efficiency}% efficacité</Text>
              </View>
            ))}
            <Text className="text-white font-semibold text-sm">Paramètres</Text>
            <Authenticated>
              <EnergieSettings />
            </Authenticated>
          </>
        )}{activeTab === "Consommation" && (
          <>
            <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold">Répartition mensuelle</Text><Text className="text-gray-400 text-sm">{totalCost.toLocaleString()}FCFA</Text></View>{CONSUMPTION_DATA.map((item, i) => (
                <View key={item.label} className="mb-3"><View className="flex justify-between mb-1"><Text className="text-gray-300 text-xs">{item.label}</Text><Text className="text-white text-xs font-medium">{item.kwh}kWh · {item.cost.toLocaleString()}FCFA</Text></View><View className="w-full h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><View initial={{ width: 0 }} animate={{ width: `${item.percent}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} className="h-full rounded-full" style={{ backgroundColor: item.color }} /></View></View>
              ))}</View>
            <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-2"><Leaf size={16} color="#10B981" /><Text className="text-white font-bold">{"Conseils d'économie"}</Text></View>{["Éteignez le climatiseur la nuit – économisez 20%", "Utilisez LED au lieu d'ampoules classiques", "Débranchez les appareils en veille"].map((tip, i) => (
                <View key={i} className="flex items-center gap-2 mt-2"><CheckCircle size={12} color="#10B981" /><Text className="text-gray-300 text-xs">{tip}</Text></View>
              ))}</View>
          </>
        )}{activeTab === "Fournisseurs" && (
          <>
            {PROVIDERS.map((p, i) => (
              <View key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                <View className="flex items-center justify-between mb-2"><Text className="text-white font-bold text-sm">{p.name}</Text><View className="flex items-center gap-1"><View className="w-2 h-2 rounded-full" style={{ backgroundColor: p.reliability > 85 ? "#10B981" : "#F59E0B" }} /><Text className="text-xs" style={{ color: p.reliability > 85 ? "#10B981" : "#F59E0B" }}>{p.reliability}% fiabilité</Text></View></View>
                <Text className="text-gray-400 text-xs mb-2">{p.type}</Text>
                <View className="flex items-center justify-between mb-3"><View className="flex items-center gap-1"><DollarSign size={10} color="#FBBF24" /><Text className="text-yellow-400 text-xs">{p.tariff}</Text></View><View className="flex items-center gap-1"><MapPin size={10} color="#9CA3AF" /><Text className="text-gray-400 text-xs">{p.coverage}</Text></View></View>
                <Pressable className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2" style={{ backgroundColor: "rgba(251,191,36,0.15)", borderWidth: 1, borderColor: "rgba(251,191,36,0.3)", borderStyle: "solid" }}><Text>Contacter:</Text>{p.contact}</Pressable>
              </View>
            ))}
            <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "dashed" }}><View className="flex items-center gap-2 mb-2"><Sun size={16} color="#FBBF24" /><Text className="text-white font-bold text-sm">Calculez votre retour sur investissement</Text></View><Text className="text-gray-400 text-xs mb-3">Un panneau solaire de 3kWh peut vous faire économiser 90 000 FCFA/mois</Text><Pressable className="w-full py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: "#FBBF24" }}>Simuler mon installation
              </Pressable></View>
          </>
        )}</View></View>
  );
}
