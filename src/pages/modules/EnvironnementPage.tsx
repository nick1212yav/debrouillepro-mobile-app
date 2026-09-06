import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import {
  ArrowLeft, Leaf, Wind, Droplets, Sun, AlertTriangle,
  TreePine, Recycle, Zap, BarChart2, MapPin, TrendingUp, TrendingDown,
  Thermometer, CloudRain, CheckCircle, Info
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { useState } from "react";
const AIR_INDEX = 72;
const AIR_LEVEL = AIR_INDEX < 50 ? "Bon" : AIR_INDEX < 100 ? "Modéré" : "Mauvais";
const AIR_COLOR = AIR_INDEX < 50 ? "#10B981" : AIR_INDEX < 100 ? "#F59E0B" : "#EF4444";

const ALERTS = [
  { id: 1, type: "warning", title: "Épisode de pollution atmosphérique", location: "Plateau, Abidjan", date: "Aujourd'hui", icon: Wind, color: "#F59E0B" },
  { id: 2, type: "danger", title: "Dépôt sauvage signalé", location: "Yopougon, km7", date: "Hier", icon: AlertTriangle, color: "#EF4444" },
  { id: 3, type: "info", title: "Collecte spéciale déchets électroniques", location: "Tout Abidjan", date: "Sam 20 jan", icon: Recycle, color: "#6366F1" },
];

const ECO_ACTIONS_DEF = [
  { id: "eco-1", title: "Tri des déchets", desc: "Triez vos déchets plastique, verre et papier", points: 50, icon: Recycle, color: "#10B981" },
  { id: "eco-2", title: "Économiser l'eau", desc: "Réduisez votre consommation de 20% ce mois", points: 100, icon: Droplets, color: "#3B82F6" },
  { id: "eco-3", title: "Transport vert", desc: "Utilisez un vélo ou la marche 3 fois cette semaine", points: 75, icon: Leaf, color: "#22C55E" },
  { id: "eco-4", title: "Énergie solaire", desc: "Renseignez-vous sur les panneaux solaires", points: 30, icon: Sun, color: "#F59E0B" },
  { id: "eco-5", title: "Planter un arbre", desc: "Participez à une journée de reboisement", points: 200, icon: TreePine, color: "#16A34A" },
];

const INDICATORS = [
  { label: "Température", value: "31°C", trend: "up", icon: Thermometer, color: "#F59E0B" },
  { label: "Humidité", value: "78%", trend: "stable", icon: Droplets, color: "#3B82F6" },
  { label: "Précipitations", value: "12mm", trend: "down", icon: CloudRain, color: "#6366F1" },
  { label: "UV Index", value: "8/11", trend: "up", icon: Sun, color: "#EF4444" },
];

const RECYCLING_POINTS = [
  { name: "Centre de tri Cocody", address: "Bd de la Paix, Cocody", dist: "1.2 km", accepts: ["Plastique", "Verre", "Papier"] },
  { name: "Point vert Plateau", address: "Av Botreau Roussel, Plateau", dist: "2.8 km", accepts: ["Plastique", "Métal", "Électronique"] },
  { name: "Collecte organique Marcory", address: "Rue 12, Marcory", dist: "3.5 km", accepts: ["Organique", "Compost"] },
];

function EnvironnementContent({ tab }: { tab: "bilan" | "actions" | "recyclage" }) {
  const progress = useQuery(api.urban.getEcoProgress);
  const toggleEcoAction = useMutation(api.urban.toggleEcoAction);

  const getActionDone = (id: string) => progress?.find((p) => p.actionId === id)?.done ?? false;
  const totalPoints = ECO_ACTIONS_DEF.reduce((sum, a) => getActionDone(a.id) ? sum + a.points : sum, 0);

  const handleToggle = async (id: string, points: number) => {
    const current = getActionDone(id);
    try {
      await toggleEcoAction({ actionId: id, points, done: !current });
    } catch {
      UIService.openToast("Erreur lors de la mise à jour", "error");
    }
  };

  if (tab === "bilan") {
    return (
      <View className="space-y-4">
        <View
          className="p-5 rounded-2xl" style={{ borderStyle: "solid" }}>
          <View className="flex items-center justify-between mb-3">
            <View>
              <Text className="text-white/60 text-xs mb-1">{"Qualité de l'air — Abidjan"}</Text>
              <View className="flex items-baseline gap-2">
                <Text className="text-white text-4xl font-bold">{AIR_INDEX}</Text>
                <Text className="text-white/60 text-sm">AQI</Text>
              </View>
              <Text className="font-semibold text-sm" style={{ color: AIR_COLOR }}>{AIR_LEVEL}</Text>
            </View>
            <View className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${AIR_COLOR}20`, borderStyle: "solid" }}>
              <Wind size={28} style={{ color: AIR_COLOR }} />
            </View>
          </View>
          <Text className="text-white/50 text-xs">Qualité modérée : les personnes sensibles peuvent ressentir des effets.</Text>
        </View>
        <View className="gap-3">
          {INDICATORS.map(({ label, value, trend, icon: Icon, color }, i) => (
            <View key={label}
              className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
              <View className="flex items-start justify-between mb-2">
                <Icon size={18} style={{ color }} />
                {trend === "up" && <TrendingUp size={14} className="text-red-400" />}
                {trend === "down" && <TrendingDown size={14} className="text-green-400" />}
                {trend === "stable" && <Text className="text-white/30 text-xs">—</Text>}
              </View>
              <Text className="text-white font-bold text-xl">{value}</Text>
              <Text className="text-white/50 text-xs">{label}</Text>
            </View>
          ))}
        </View>
        <View>
          <Text className="text-white font-semibold text-sm mb-3">{"Alertes & Événements"}</Text>
          <View className="space-y-3">
            {ALERTS.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <View key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: `${alert.color}10`, borderStyle: "solid" }}>
                  <View className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${alert.color}20` }}>
                    <Icon size={16} style={{ color: alert.color }} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium">{alert.title}</Text>
                    <View className="flex items-center gap-2 mt-0.5">
                      <MapPin size={11} className="text-white/40" /><Text className="text-white/50 text-xs">{alert.location}</Text>
                      <Text className="text-white/30 text-xs ml-auto">{alert.date}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  if (tab === "actions") {
    return (
      <View className="space-y-4">
        <View
          className="p-4 rounded-2xl flex items-center gap-4" style={{ borderWidth: 1, borderColor: "rgba(34,197,94,0.3)", borderStyle: "solid" }}>
          <View className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.2)" }}>
            <Leaf size={28} className="text-green-400" />
          </View>
          <View>
            <Text className="text-white/60 text-xs">Vos points éco</Text>
            <Text className="text-green-400 text-3xl font-bold">{totalPoints}</Text>
            <Text className="text-white/50 text-xs">Continuez vos efforts !</Text>
          </View>
          <View className="ml-auto">
            <Text className="text-white/40 text-xs text-right">Niveau</Text>
            <Text className="text-green-300 font-semibold text-sm">Éco-Actif</Text>
          </View>
        </View>
        <Text className="text-white font-semibold text-sm">Défis de la semaine</Text>
        <View className="space-y-3">
          {ECO_ACTIONS_DEF.map((action, i) => {
            const Icon = action.icon;
            const done = getActionDone(action.id);
            return (
              <Pressable key={action.id}
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: done ? `${action.color}12` : "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                onPress={() => { void handleToggle(action.id, action.points); }}>
                <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${action.color}20` }}>
                  <Icon size={20} style={{ color: action.color }} />
                </View>
                <View className="flex-1">
                  <Text className={`font-medium text-sm ${done ? "line-through text-white/50" : "text-white"}`}>{action.title}</Text>
                  <Text className="text-white/40 text-xs mt-0.5">{action.desc}</Text>
                </View>
                <View className="flex flex-col items-end gap-1">
                  <Text className="text-xs font-semibold" style={{ color: action.color }}>+{action.points} pts</Text>
                  {done && <CheckCircle size={16} style={{ color: action.color }} />}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View className="p-4 rounded-xl flex items-center gap-3" style={{ backgroundColor: "rgba(99,102,241,0.1)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}>
          <Info size={18} className="text-indigo-400 flex-shrink-0" />
          <Text className="text-white/60 text-xs">Accumulez des points éco pour débloquer des récompenses : réductions partenaires, arbres plantés, et badges exclusifs.</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      <View className="gap-3">
        {[
          { icon: Recycle, label: "Plastique", color: "#3B82F6", tip: "Bouteilles, emballages" },
          { icon: Zap, label: "Électronique", color: "#F59E0B", tip: "Téléphones, piles" },
          { icon: TreePine, label: "Organique", color: "#22C55E", tip: "Déchets alimentaires" },
        ].map(({ icon: Icon, label, color, tip }) => (
          <View key={label} className="p-3 rounded-xl flex flex-col items-center gap-2" style={{ backgroundColor: `${color}12`, borderStyle: "solid" }}>
            <Icon size={24} style={{ color }} />
            <Text className="text-white font-medium text-xs text-center">{label}</Text>
            <Text className="text-white/40 text-xs text-center">{tip}</Text>
          </View>
        ))}
      </View>
      <Text className="text-white font-semibold text-sm">Points de collecte proches</Text>
      <View className="space-y-3">
        {RECYCLING_POINTS.map((point, i) => (
          <View key={point.name}
            className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
            <View className="flex items-start justify-between mb-2">
              <Text className="text-white font-medium text-sm">{point.name}</Text>
              <Text className="text-green-400 text-xs font-semibold">{point.dist}</Text>
            </View>
            <View className="flex items-center gap-1 mb-2">
              <MapPin size={11} className="text-white/40" />
              <Text className="text-white/50 text-xs">{point.address}</Text>
            </View>
            <View className="flex flex-wrap gap-1.5">
              {point.accepts.map(a => (
                <Text key={a} className="px-2 py-0.5 rounded text-xs text-green-300" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>{a}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function EnvironnementPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"bilan" | "actions" | "recyclage">("bilan");

  return (
    <View className="h-full flex flex-col" style={{  }}>
      <View className="flex-shrink-0 px-4 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Environnement</Text>
            <Text className="text-xs text-white/50">{"Qualité de l'air, éco-gestes & recyclage"}</Text>
          </View>
          <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.2)" }}>
            <Leaf size={18} className="text-green-400" />
          </View>
        </View>
        <View className="flex gap-1 p-1 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {(["bilan", "actions", "recyclage"] as const).map(t => (
            <Pressable key={t} onPress={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-medium capitalize"
              style={{ backgroundColor: tab === t ? "rgba(34,197,94,0.4)" : "transparent" }}>
              {t === "bilan" ? "Bilan" : t === "actions" ? "Éco-gestes" : "Recyclage"}
            </Pressable>
          ))}
        </View>
      </View>
      <View className="flex-1 overflow-y-auto px-4 pb-6">
        <Authenticated>
          <EnvironnementContent tab={tab} />
        </Authenticated>
        <Unauthenticated>
          <EnvironnementContent tab={tab} />
        </Unauthenticated>
      </View>
    </View>
  );
}
