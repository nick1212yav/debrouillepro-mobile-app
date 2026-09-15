import { View, Pressable, Text } from "react-native";

// src/pages/modules/PrescriptionPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ArrowLeft,
  Download,
  Printer,
  Calendar,
  User,
  Stethoscope,
  Pill,
  CheckCircle,
  Loader2,
} from "lucide-react-native";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function PrescriptionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const prescriptionId = id as Id<"prescriptions">;
  const prescription = useQuery(api.health.getPrescription, {
    id: prescriptionId,
  });

  const handleDownload = () => {
    toast.info("Téléchargement en cours de développement");
  };

  const handlePrint = () => {
    window.print();
  };

  if (!prescription) {
    return (
      <View className="h-full flex items-center justify-center" style={{  }}><Loader2 className="w-8 h-8 text-white/40 animate-spin" /></View>
    );
  }

  return (
    <View className="h-full flex flex-col" style={{  }}><View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><ArrowLeft size={20} className="text-white" /></Pressable><Text className="text-white font-bold text-lg flex-1 truncate">Ordonnance
        </Text><View className="flex items-center gap-1.5"><Pressable onPress={handleDownload} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><Download size={18} className="text-white/60" /></Pressable><Pressable onPress={handlePrint} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><Printer size={18} className="text-white/60" /></Pressable></View></View><View className="flex-1 overflow-y-auto px-4 pb-8 space-y-4" style={{  }}><View className="p-4 rounded-2xl bg-white/5 border border-white/10" id="prescription-content"><View className="text-center border-b border-white/10 pb-4 mb-4"><Text className="text-white font-bold text-lg">DÉBROUILLE PRO</Text><Text className="text-white/40 text-xs">Ordonnance médicale</Text></View><View className="space-y-3 text-sm"><View className="flex items-center gap-3"><User size={16} className="text-white/40" /><View><Text className="text-white/40 text-xs">Patient</Text><Text className="text-white font-medium">{prescription.patientName}</Text></View></View><View className="flex items-center gap-3"><Stethoscope size={16} className="text-white/40" /><View><Text className="text-white/40 text-xs">Médecin</Text><Text className="text-white font-medium">{prescription.doctorName}</Text></View></View><View className="flex items-center gap-3"><Calendar size={16} className="text-white/40" /><View><Text className="text-white/40 text-xs">Date</Text><Text className="text-white font-medium">{new Date(prescription.date).toLocaleDateString("fr-FR")}</Text></View></View></View><View className="mt-4 pt-4 border-t border-white/10"><Text className="text-white/40 text-xs uppercase tracking-wider mb-2">Médicaments
            </Text>{prescription.medications?.map((med: any, idx: number) => (
              <View key={idx} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0"><Pill size={16} className="text-orange-400 mt-0.5" /><View><Text className="text-white font-medium">{med.name}</Text><Text className="text-white/50 text-xs">{med.dosage}· {med.frequency}· {med.duration}</Text></View></View>
            ))}</View>{prescription.notes && (
            <View className="mt-4 pt-4 border-t border-white/10"><Text className="text-white/40 text-xs uppercase tracking-wider mb-1">Notes
              </Text><Text className="text-white/60 text-sm">{prescription.notes}</Text></View>
          )}<View className="mt-4 pt-4 border-t border-white/10 text-center"><CheckCircle size={20} className="mx-auto text-green-400 mb-1" /><Text className="text-white/30 text-xs">Ordonnance valide jusqu'au{" "}{new Date(prescription.validUntil).toLocaleDateString("fr-FR")}</Text></View></View></View></View>
  );
}
