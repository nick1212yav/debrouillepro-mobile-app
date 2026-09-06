import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorPrescription.tsx
import { FileText, Pill, Calendar, Download, Eye } from "lucide-react-native";

export interface Prescription {
  id: string;
  date: Date;
  doctorName: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  notes?: string;
  validUntil?: Date;
  status: "active" | "expired" | "cancelled";
}

interface DoctorPrescriptionProps {
  prescriptions: Prescription[];
  onView?: (prescription: Prescription) => void;
  onDownload?: (prescription: Prescription) => void;
}

export function DoctorPrescription({
  prescriptions,
  onView,
  onDownload,
}: DoctorPrescriptionProps) {
  if (!prescriptions || prescriptions.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <FileText size={14} /> Ordonnances
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">
          Aucune ordonnance
        </Text>
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <FileText size={14} /> Ordonnances ({prescriptions.length})
      </Text>
      <View
        className="space-y-3 max-h-60 overflow-y-auto"
        style={{  }}
      >
        {prescriptions.map((p) => (
          <View
            key={p.id}
            className="p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <View className="flex items-start justify-between">
              <View>
                <Text className="text-white text-sm font-medium">{p.doctorName}</Text>
                <Text className="text-white/40 text-xs">
                  {p.date.toLocaleDateString("fr-FR")}
                </Text>
              </View>
              <View className="flex items-center gap-1.5">
                {onView && (
                  <Pressable
                    onPress={() => onView(p)}
                    className="p-1.5 rounded-lg"
                  >
                    <Eye size={14} className="text-white/40" />
                  </Pressable>
                )}
                {onDownload && (
                  <Pressable
                    onPress={() => onDownload(p)}
                    className="p-1.5 rounded-lg"
                  >
                    <Download size={14} className="text-white/40" />
                  </Pressable>
                )}
              </View>
            </View>
            <View className="mt-2 space-y-1">
              {p.medications.slice(0, 2).map((med, idx) => (
                <View key={idx} className="flex items-center gap-1.5 text-xs">
                  <Pill size={10} className="text-orange-400" />
                  <Text className="text-white/70">{med.name}</Text>
                  <Text className="text-white/40">· {med.dosage}</Text>
                </View>
              ))}
              {p.medications.length > 2 && (
                <Text className="text-[10px] text-white/30">
                  +{p.medications.length - 2} autre(s) médicament(s)
                </Text>
              )}
            </View>
            <View className="flex items-center gap-2 mt-2">
              <Text
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  p.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : p.status === "expired"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-white/10 text-white/40"
                }`}
              >
                {p.status === "active"
                  ? "Active"
                  : p.status === "expired"
                    ? "Expirée"
                    : "Annulée"}
              </Text>
              {p.validUntil && (
                <Text className="text-[10px] text-white/30">
                  <Text>Valable jusqu'au</Text>{p.validUntil.toLocaleDateString("fr-FR")}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
