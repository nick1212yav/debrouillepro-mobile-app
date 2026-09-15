import { View, Text, Pressable } from "react-native";

// src/pages/modules/MedicalRecordPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  FileText,
  Pill,
  Syringe,
  TestTube,
  Microscope,
  ChevronRight,
  Loader2,
} from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";

export default function MedicalRecordPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<
    "prescriptions" | "vaccinations" | "lab_results" | "imaging"
  >("prescriptions");

  const records = useQuery(
    api.health.getMedicalRecords,
    isAuthenticated ? {} : "skip",
  );

  if (!isAuthenticated) {
    return (
      <View className="h-full flex flex-col items-center justify-center px-4 gap-4" style={{  }}><Text className="text-white font-bold text-xl">Connexion requise</Text><Text className="text-white/50 text-sm">Connectez-vous pour accéder à votre dossier médical
        </Text><SignInButton /><Pressable onPress={() => navigate(-1)} className="text-white/40 text-sm transition-colors"><Text>← Retour</Text></Pressable></View>
    );
  }

  const tabs = [
    { key: "prescriptions", label: "Ordonnances", icon: FileText },
    { key: "vaccinations", label: "Vaccins", icon: Syringe },
    { key: "lab_results", label: "Analyses", icon: TestTube },
    { key: "imaging", label: "Imagerie", icon: Microscope },
  ] as const;

  return (
    <View className="h-full flex flex-col" style={{  }}><View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><ArrowLeft size={20} className="text-white" /></Pressable><Text className="text-white font-bold text-lg flex-1 truncate">Dossier médical
        </Text></View><View className="flex-shrink-0 px-4"><View className="flex gap-1 bg-white/5 rounded-xl p-1">{tabs.map((tab) => (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:bg-white/5"
              }`}><tab.icon size={12} />{tab.label}</Pressable>
          ))}</View></View><View className="flex-1 overflow-y-auto px-4 pb-8 pt-4 space-y-3" style={{  }}>{records === undefined ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : records.length === 0 ? (
          <View className="text-center py-12 text-white/40 text-sm"><FileText size={32} className="mx-auto mb-3 opacity-30" /><Text>Aucun enregistrement médical</Text></View>
        ) : (
          records.map((record: any) => (
            <View key={record._id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 transition-colors"><View className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center"><Pill size={18} className="text-orange-400" /></View><View className="flex-1"><Text className="text-white font-medium text-sm">{record.title}</Text><Text className="text-white/40 text-xs">{record.date}· {record.doctor || "Médecin"}</Text></View><ChevronRight size={16} className="text-white/20" /></View>
          ))
        )}</View></View>
  );
}
