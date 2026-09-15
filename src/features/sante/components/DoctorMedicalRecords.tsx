import { View, Text } from "react-native";

// src/features/sante/components/DoctorMedicalRecords.tsx
import { FolderOpen, FileText, Calendar, User } from "lucide-react-native";

export interface MedicalRecord {
  id: string;
  type: "visit" | "lab" | "imaging" | "vaccination" | "prescription";
  title: string;
  date: Date;
  doctor?: string;
  summary: string;
}

interface DoctorMedicalRecordsProps {
  records: MedicalRecord[];
  onRecordClick?: (record: MedicalRecord) => void;
}

const typeIcons = {
  visit: User,
  lab: FileText,
  imaging: FileText,
  vaccination: FileText,
  prescription: FileText,
};

const typeLabels = {
  visit: "Consultation",
  lab: "Analyse",
  imaging: "Imagerie",
  vaccination: "Vaccination",
  prescription: "Ordonnance",
};

export function DoctorMedicalRecords({
  records,
  onRecordClick,
}: DoctorMedicalRecordsProps) {
  if (!records || records.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3"><FolderOpen size={14} />Dossier médical
        </Text><Text className="text-xs text-white/30 text-center py-4">Aucun enregistrement
        </Text></View>
    );
  }

  const sorted = [...records].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3"><FolderOpen size={14} />Dossier médical ({records.length})
      </Text><View className="space-y-2 max-h-60 overflow-y-auto" style={{  }}>{sorted.slice(0, 5).map((record) => {
          const Icon = typeIcons[record.type] || FileText;
          return (
            <View key={record.id} onPress={() => onRecordClick?.(record)} className="flex items-start gap-3 p-2 rounded-xl bg-white/5 border border-white/10 transition-colors"><View className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0"><Icon size={14} className="text-blue-400" /></View><View className="flex-1 min-w-0"><Text className="text-white text-sm font-medium truncate">{record.title}</Text><Text className="text-white/40 text-xs flex items-center gap-2"><Text>{typeLabels[record.type] || record.type}</Text><Text>·</Text><Calendar size={10} className="inline" /><Text>{record.date.toLocaleDateString("fr-FR")}</Text></Text><Text className="text-white/50 text-xs truncate">{record.summary}</Text></View></View>
          );
        })}{records.length > 5 && (
          <Text className="text-center text-[10px] text-white/30">
            +{records.length - 5} autre(s) enregistrement(s)
          </Text>
        )}</View></View>
  );
}
