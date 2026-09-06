import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { ArrowLeft, AlertTriangle, Phone, MapPin, Shield, Plus, Bell } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
const EMERGENCY = [
  { label: "Police Nationale", number: "111", color: "#6366F1" },
  { label: "Sapeurs Pompiers", number: "118", color: "#EF4444" },
  { label: "SAMU / Urgences", number: "185", color: "#10B981" },
  { label: "Gendarmerie", number: "113", color: "#F59E0B" },
];

const ZONES = [
  { name: "Plateau", risk: "Faible", color: "#10B981" },
  { name: "Cocody", risk: "Faible", color: "#10B981" },
  { name: "Marcory", risk: "Modéré", color: "#F59E0B" },
  { name: "Adjamé", risk: "Élevé", color: "#EF4444" },
  { name: "Yopougon", risk: "Modéré", color: "#F59E0B" },
  { name: "Abobo", risk: "Élevé", color: "#EF4444" },
];

const severityColor = (s: string) => s === "high" ? "#EF4444" : s === "medium" ? "#F59E0B" : "#10B981";
const severityBg = (s: string) => s === "high" ? "rgba(239,68,68,.15)" : s === "medium" ? "rgba(245,158,11,.15)" : "rgba(16,185,129,.15)";

function IncidentsTab() {
  const incidents = useQuery(api.civic.listRecentIncidents, {});
  const createIncident = useMutation(api.civic.createSecurityIncident);
  const [showForm, setShowForm] = useState(false);
  const [incidentType, setIncidentType] = useState("");
  const [incidentLoc, setIncidentLoc] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!incidentType || !incidentLoc) return;
    setSubmitting(true);
    try {
      await createIncident({ type: incidentType, location: incidentLoc, severity });
      UIService.openToast("Incident signalé", "success");
      setShowForm(false);
      setIncidentType(""); setIncidentLoc("");
    } catch {
      UIService.openToast("Erreur lors du signalement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Authenticated>
        <Pressable onPress={() => setShowForm(true)} className="w-full flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(239,68,68,.08)", borderWidth: 1, borderColor: "rgba(239,68,68,.3)", borderStyle: "dashed" }}>
          <Plus size={18} color="#EF4444" />
          <Text className="text-red-400 font-semibold text-sm">Signaler un incident</Text>
        </Pressable>
        {showForm && (
          <View className="p-4 rounded-2xl space-y-3" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
            <Picker onValueChange={val => setIncidentType(val)} className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderStyle: "solid" }} selectedValue={incidentType}>
              <Picker.Item label="Type d'incident..." value="" />
              <Picker.Item label="Accident" value="Accident" />
              <Picker.Item label="Agression" value="Agression" />
              <Picker.Item label="Vol" value="Vol" />
              <Picker.Item label="Incendie" value="Incendie" />
              <Picker.Item label="Trouble à l'ordre public" value="Trouble à l'ordre public" />
            </Picker>
            <TextInput value={incidentLoc} onChangeText={text => setIncidentLoc(text)} placeholder="Localisation..." className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderStyle: "solid" }} />
            <View className="flex gap-2">
              {(["low", "medium", "high"] as const).map(s => (
                <Pressable key={s} onPress={() => setSeverity(s)} className="flex-1 py-1.5 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: severity === s ? severityBg(s) : "rgba(255,255,255,.05)", borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
                  {s === "low" ? "Faible" : s === "medium" ? "Modéré" : "Élevé"}
                </Pressable>
              ))}
            </View>
            <View className="flex gap-2">
              <Pressable onPress={() => setShowForm(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ backgroundColor: "rgba(255,255,255,.06)" }}><Text>Annuler</Text></Pressable>
              <Pressable onPress={handleSubmit} disabled={submitting || !incidentType || !incidentLoc} className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-50" style={{ backgroundColor: "#EF4444" }}>
                {submitting ? "Envoi..." : "Signaler"}
              </Pressable>
            </View>
          </View>
        )}
      </Authenticated>

      {incidents === undefined ? (
        <View className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</View>
      ) : incidents.length === 0 ? (
        <View className="text-center py-6">
          <Shield size={32} className="mx-auto mb-2 text-white/20" />
          <Text className="text-gray-500 text-sm">Aucun incident signalé récemment</Text>
        </View>
      ) : incidents.map((inc, i) => (
        <View key={inc._id}
          className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
          <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: severityBg(inc.severity) }}>
            <AlertTriangle size={16} color={severityColor(inc.severity)} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">{inc.type}</Text>
            <View className="flex items-center gap-1"><MapPin size={10} color="#9CA3AF" /><Text className="text-gray-400 text-xs">{inc.location}</Text></View>
          </View>
          <View className="text-right">
            <Text className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: inc.status === "Résolu" ? "rgba(16,185,129,.15)" : "rgba(245,158,11,.15)", color: inc.status === "Résolu" ? "#10B981" : "#F59E0B" }}>{inc.status}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

export default function SecuritePubliquePage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Incidents");
  const [notifications, setNotifications] = useState(true);

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>
      <View className="flex items-center gap-3 px-4 pt-12 pb-3">
        <Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable>
        <View className="flex-1"><Text className="text-white font-bold text-lg">Sécurité Publique</Text><Text className="text-gray-400 text-xs">Alerter · Signaler · Suivre</Text></View>
        <Pressable onPress={() => setNotifications(!notifications)} className="p-2 rounded-full" style={{ backgroundColor: notifications ? "rgba(239,68,68,.2)" : "rgba(255,255,255,.06)" }}>
          <Bell size={16} color={notifications ? "#EF4444" : "#9CA3AF"} />
        </Pressable>
      </View>

      <View className="flex gap-1 mx-4 mb-4 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.04)" }}>
        {["Incidents", "Urgences", "Zones"].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,.1)" : "transparent" }}>{tab}</Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-3" style={{  }}>
        {activeTab === "Incidents" && (
          <>
            <AuthLoading><Skeleton className="h-16 w-full rounded-2xl" /></AuthLoading>
            <Unauthenticated>
              <View className="text-center py-4">
                <Text className="text-gray-500 text-xs">Connectez-vous pour signaler un incident</Text>
              </View>
            </Unauthenticated>
            <IncidentsTab />
          </>
        )}
        {activeTab === "Urgences" && (
          <>
            <View className="p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,.08)", borderWidth: 1, borderColor: "rgba(239,68,68,.2)", borderStyle: "solid" }}>
              <Text className="text-red-400 text-xs text-center font-medium">En cas de danger immédiat, appelez immédiatement</Text>
            </View>
            {EMERGENCY.map((e, i) => (
              <View key={i}
                className="flex items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${e.color}20` }}>
                    <Phone size={16} color={e.color} />
                  </View>
                  <Text className="text-white font-semibold text-sm">{e.label}</Text>
                </View>
                <View className="px-4 py-2 rounded-xl font-bold text-sm" style={{ backgroundColor: e.color }}>{e.number}</View>
              </View>
            ))}
          </>
        )}
        {activeTab === "Zones" && (
          <>
            <Text className="text-gray-400 text-xs"><Text>Niveau de risque sécuritaire par commune – Abidjan</Text></Text>
            {ZONES.map((z, i) => (
              <View key={z.name}
                className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
                <Shield size={16} color={z.color} />
                <Text className="text-white font-medium text-sm flex-1">{z.name}</Text>
                <Text className="text-xs px-3 py-1 rounded-full font-bold" style={{ backgroundColor: `${z.color}20`, color: z.color }}>{z.risk}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    </View>
  );
}
