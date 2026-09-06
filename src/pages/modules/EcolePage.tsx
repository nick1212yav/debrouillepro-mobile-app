import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { ArrowLeft, BookOpen, Calendar, TrendingUp, MessageSquare, CheckCircle, Clock } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
const SUBJECTS = [
  { name: "Mathématiques", teacher: "M. Konan", avg: 14.5, nextClass: "Lun 09h00", color: "#6366F1", trend: "up" },
  { name: "Français", teacher: "Mme Traoré", avg: 12.8, nextClass: "Mar 10h30", color: "#EC4899", trend: "stable" },
  { name: "Sciences", teacher: "M. Bamba", avg: 15.2, nextClass: "Mer 08h00", color: "#10B981", trend: "up" },
  { name: "Histoire-Géo", teacher: "Mme Coulibaly", avg: 13.1, nextClass: "Jeu 14h00", color: "#F59E0B", trend: "down" },
  { name: "Anglais", teacher: "M. Diallo", avg: 16.0, nextClass: "Ven 11h00", color: "#06B6D4", trend: "up" },
];

const EVENTS = [
  { title: "Examen blanc – Mathématiques", date: "20 Juin 2025", type: "Examen" },
  { title: "Réunion parents d'élèves", date: "25 Juin 2025", type: "Réunion" },
  { title: "Sortie scolaire Musée National", date: "2 Juil 2025", type: "Activité" },
  { title: "Résultats du 3ème trimestre", date: "5 Juil 2025", type: "Résultats" },
];

function MessagesTab() {
  const messages = useQuery(api.localServices.listMySchoolMessages, {});
  const markRead = useMutation(api.localServices.markSchoolMessageRead);

  if (messages === undefined) {
    return <View className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}</View>;
  }

  if (messages.length === 0) {
    return (
      <View className="text-center py-8">
        <MessageSquare size={32} className="mx-auto mb-2 text-white/20" />
        <Text className="text-gray-500 text-sm">Aucun message scolaire</Text>
        <Text className="text-gray-600 text-xs mt-1">Les messages de votre école apparaîtront ici</Text>
      </View>
    );
  }

  return (
    <>
      {messages.map((msg, i) => (
        <Pressable key={msg._id}
          onPress={() => { if (!msg.read) markRead({ messageId: msg._id }).catch(() => UIService.openToast("Erreur", "error")); }}
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ backgroundColor: msg.read ? "rgba(255,255,255,.04)" : "rgba(245,158,11,.06)", borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
          <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,.15)" }}>
            <MessageSquare size={16} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <View className="flex items-center gap-2">
              <Text className="text-white font-semibold text-sm">{msg.fromName}</Text>
              {!msg.read && <View className="w-2 h-2 rounded-full bg-yellow-400" />}
            </View>
            <Text className="text-gray-400 text-xs">{msg.subject}</Text>
          </View>
          {msg.read && <CheckCircle size={14} color="#10B981" />}
        </Pressable>
      ))}
    </>
  );
}

export default function EcolePage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("Notes");
  const globalAvg = SUBJECTS.reduce((s, sub) => s + sub.avg, 0) / SUBJECTS.length;

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>
      <View className="flex items-center gap-3 px-4 pt-12 pb-3">
        <Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable>
        <View className="flex-1"><Text className="text-white font-bold text-lg">École & Vie Scolaire</Text><Text className="text-gray-400 text-xs">Inscrire · Suivre · Communiquer</Text></View>
        <View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,.15)" }}><BookOpen size={16} color="#F59E0B" /></View>
      </View>

      <View className="flex gap-3 px-4 mb-3">
        <View className="flex-1 p-3 rounded-xl text-center" style={{ borderWidth: 1, borderColor: "rgba(99,102,241,.3)", borderStyle: "solid" }}>
          <Text className="text-gray-400 text-xs">Moyenne générale</Text>
          <Text className="text-white font-bold text-2xl">{globalAvg.toFixed(1)}<Text className="text-sm text-gray-400">/20</Text></Text>
        </View>
        <View className="flex-1 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(239,68,68,.08)", borderWidth: 1, borderColor: "rgba(239,68,68,.2)", borderStyle: "solid" }}>
          <Text className="text-gray-400 text-xs">Absences</Text>
          <Text className="font-bold text-2xl text-red-400">2</Text>
        </View>
      </View>

      <View className="flex gap-1 mx-4 mb-4 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.04)" }}>
        {["Notes", "Agenda", "Messages"].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,.1)" : "transparent" }}>{tab}</Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-3" style={{  }}>
        {activeTab === "Notes" && SUBJECTS.map((sub, i) => (
          <View key={sub.name}
            className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
            <View className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ backgroundColor: `${sub.color}20` }}>{sub.avg}</View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-sm">{sub.name}</Text>
              <View className="flex items-center gap-2 mt-0.5">
                <Text className="text-gray-400 text-xs">{sub.teacher}</Text>
                <View className="flex items-center gap-1"><Clock size={9} color="#9CA3AF" /><Text className="text-gray-400 text-xs">{sub.nextClass}</Text></View>
              </View>
            </View>
            <TrendingUp size={14} color={sub.trend === "up" ? "#10B981" : sub.trend === "down" ? "#EF4444" : "#9CA3AF"} style={{ transform: sub.trend === "down" ? "scaleY(-1)" : "none" }} />
          </View>
        ))}

        {activeTab === "Agenda" && EVENTS.map((ev, i) => (
          <View key={i}
            className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
            <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(245,158,11,.15)" }}>
              <Calendar size={16} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-sm">{ev.title}</Text>
              <Text className="text-gray-400 text-xs">{ev.date}</Text>
            </View>
            <Text className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(99,102,241,.15)", color: "#A5B4FC" }}>{ev.type}</Text>
          </View>
        ))}

        {activeTab === "Messages" && (
          <>
            <AuthLoading><Skeleton className="h-16 w-full rounded-2xl" /></AuthLoading>
            <Unauthenticated>
              <View className="text-center py-8">
                <MessageSquare size={32} className="mx-auto mb-2 text-white/20" />
                <Text className="text-gray-500 text-sm"><Text>Connectez-vous pour voir vos messages scolaires</Text></Text>
              </View>
            </Unauthenticated>
            <Authenticated><MessagesTab /></Authenticated>
          </>
        )}
      </View>
    </View>
  );
}
