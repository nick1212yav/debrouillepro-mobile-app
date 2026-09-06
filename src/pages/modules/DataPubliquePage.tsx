import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { ArrowLeft, BarChart2, TrendingUp, TrendingDown, Database, Search, Bell, Download, Globe, Users, DollarSign } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";
const DATASETS = [
  { id: 1, name: "Population par district", source: "INS CI", updated: "Mars 2025", downloads: 2340, category: "Démographie", color: "#6366F1" },
  { id: 2, name: "PIB et croissance économique", source: "Ministère Finances", updated: "Avr 2025", downloads: 5678, category: "Économie", color: "#10B981" },
  { id: 3, name: "Taux d'alphabétisation", source: "MENA", updated: "Jan 2025", downloads: 1234, category: "Éducation", color: "#F59E0B" },
  { id: 4, name: "Accès à l'eau potable", source: "ONEP", updated: "Fév 2025", downloads: 987, category: "Santé/Eau", color: "#06B6D4" },
  { id: 5, name: "Budget de l'État 2025", source: "MEF", updated: "Jan 2025", downloads: 8923, category: "Finance publique", color: "#EC4899" },
];

const INDICATORS = [
  { label: "PIB 2024", value: "42 240", unit: "Mds FCFA", trend: "+6.2%", up: true, color: "#10B981" },
  { label: "Population", value: "27.5 M", unit: "habitants", trend: "+2.1%", up: true, color: "#6366F1" },
  { label: "Inflation", value: "3.8%", unit: "annuelle", trend: "-0.4%", up: false, color: "#F59E0B" },
  { label: "Chômage", value: "9.4%", unit: "actifs", trend: "+0.3%", up: false, color: "#EF4444" },
];

const CATEGORIES = ["Tout", "Démographie", "Économie", "Éducation", "Santé/Eau", "Finance publique"];

function AlertButton({ dataset }: { dataset: typeof DATASETS[0] }) {
  const alerts = useQuery(api.civic.listMyDataAlerts, {});
  const toggleAlert = useMutation(api.civic.toggleDataAlert);
  const isSet = alerts?.some(a => a.datasetId === dataset.id) ?? false;

  const handleToggle = async () => {
    try {
      const added = await toggleAlert({ datasetId: dataset.id, datasetName: dataset.name });
      UIService.openToast(added ? "Alerte activée" : "Alerte désactivée", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  return (
    <Pressable onPress={handleToggle}
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ backgroundColor: isSet ? "rgba(245,158,11,.3)" : "rgba(255,255,255,.06)" }}>
      <Bell size={14} color={isSet ? "#F59E0B" : "#9CA3AF"} />
    </Pressable>
  );
}

export default function DataPubliquePage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Indicateurs");
  const [catFilter, setCatFilter] = useState("Tout");
  const [search, setSearch] = useState("");

  const filtered = DATASETS.filter(d =>
    (catFilter === "Tout" || d.category === catFilter) &&
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>
      <View className="flex items-center gap-3 px-4 pt-12 pb-3">
        <Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable>
        <View className="flex-1"><Text className="text-white font-bold text-lg">Data Publique</Text><Text className="text-gray-400 text-xs">Open Data · Statistiques · Transparence</Text></View>
        <View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(99,102,241,.15)" }}><Database size={16} color="#6366F1" /></View>
      </View>
      <View className="flex gap-1 mx-4 mb-4 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.04)" }}>
        {["Indicateurs", "Données"].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,.1)" : "transparent" }}>{tab}</Pressable>
        ))}
      </View>
      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4" style={{  }}>
        {activeTab === "Indicateurs" && (
          <>
            <Text className="text-gray-400 text-xs">Indicateurs macroéconomiques – Côte d'Ivoire 2025</Text>
            {INDICATORS.map((ind, i) => (
              <View key={ind.label}
                className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
                <View className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${ind.color}15` }}>
                  <BarChart2 size={22} color={ind.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs">{ind.label}</Text>
                  <Text className="text-white font-bold text-xl">{ind.value} <Text className="text-sm font-normal text-gray-400">{ind.unit}</Text></Text>
                </View>
                <View className="flex items-center gap-1">
                  {ind.up ? <TrendingUp size={14} color={ind.color} /> : <TrendingDown size={14} color={ind.color} />}
                  <Text className="font-bold text-sm" style={{ color: ind.color }}>{ind.trend}</Text>
                </View>
              </View>
            ))}
            <View className="gap-3">
              {[{ icon: Globe, label: "Rang Afrique", value: "#4", color: "#F59E0B" }, { icon: Users, label: "IDH", value: "0.55", color: "#10B981" }, { icon: DollarSign, label: "PIB/hab.", value: "1 540$", color: "#6366F1" }].map(({ icon: Icon, label, value, color }) => (
                <View key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
                  <Icon size={16} color={color} className="mx-auto mb-1" />
                  <Text className="text-white font-bold text-sm">{value}</Text>
                  <Text className="text-gray-500 text-xs">{label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        {activeTab === "Données" && (
          <>
            <View className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
              <Search size={14} color="#9CA3AF" />
              <TextInput value={search} onChangeText={text => setSearch(text)} placeholder="Rechercher des données..." className="flex-1 bg-transparent text-white text-sm outline-none" />
            </View>
            <View className="flex gap-2 overflow-x-auto pb-1" style={{  }}>
              {CATEGORIES.map(cat => <Pressable key={cat} onPress={() => setCatFilter(cat)} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: catFilter === cat ? "#6366F1" : "rgba(255,255,255,.06)" }}>{cat}</Pressable>)}
            </View>
            {filtered.map((d, i) => (
              <View key={d.id}
                className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
                <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${d.color}20` }}>
                  <Database size={18} color={d.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-sm">{d.name}</Text>
                  <Text className="text-gray-400 text-xs">{d.source} · {d.updated}</Text>
                  <View className="flex items-center gap-2 mt-0.5">
                    <Text className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${d.color}20`, color: d.color }}>{d.category}</Text>
                    <Text className="text-gray-500 text-xs">{d.downloads.toLocaleString()} <Text>DL</Text></Text>
                  </View>
                </View>
                <View className="flex flex-col gap-2">
                  <Pressable className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,.15)" }}><Download size={14} color="#10B981" /></Pressable>
                  <Authenticated>
                    <AlertButton dataset={d} />
                  </Authenticated>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}
