import { View, Text, Pressable } from "react-native";
// src/features/sante/components/DoctorVaccination.tsx
import { Syringe, Calendar, CheckCircle, XCircle } from "lucide-react-native";

export interface Vaccination {
  id: string;
  name: string;
  date: Date;
  nextDose?: Date;
  status: "completed" | "pending" | "overdue";
  administeredBy?: string;
  location?: string;
}

interface DoctorVaccinationProps {
  vaccinations: Vaccination[];
  onAdd?: () => void;
  onUpdate?: (vaccination: Vaccination) => void;
}

export function DoctorVaccination({
  vaccinations,
  onAdd,
  onUpdate,
}: DoctorVaccinationProps) {
  if (!vaccinations || vaccinations.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
          <Syringe size={14} /> Carnet de vaccination
        </Text>
        <Text className="text-xs text-white/30 text-center py-4">
          Aucun vaccin enregistré
        </Text>
        {onAdd && (
          <Pressable
            onPress={onAdd}
            className="w-full mt-2 py-2 rounded-xl text-sm font-medium text-blue-400 bg-blue-500/20 border border-blue-500/20"
          >
            <Text>+ Ajouter un vaccin</Text></Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <View className="flex items-center justify-between mb-3">
        <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2">
          <Syringe size={14} /> Carnet de vaccination ({vaccinations.length})
        </Text>
        {onAdd && (
          <Pressable
            onPress={onAdd}
            className="text-xs text-blue-400"
          >
            <Text>+ Ajouter</Text></Pressable>
        )}
      </View>
      <View
        className="space-y-2 max-h-60 overflow-y-auto"
        style={{  }}
      >
        {vaccinations.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => onUpdate?.(v)}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10"
          >
            <View
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                v.status === "completed"
                  ? "bg-green-500/20"
                  : v.status === "pending"
                    ? "bg-yellow-500/20"
                    : "bg-red-500/20"
              }`}
            >
              {v.status === "completed" ? (
                <CheckCircle size={14} className="text-green-400" />
              ) : v.status === "pending" ? (
                <Calendar size={14} className="text-yellow-400" />
              ) : (
                <XCircle size={14} className="text-red-400" />
              )}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-medium truncate">
                {v.name}
              </Text>
              <Text className="text-white/40 text-xs flex items-center gap-1">
                <Calendar size={10} />
                {v.date.toLocaleDateString("fr-FR")}
                {v.nextDose && (
                  <Text className="text-white/30">
                    <Text>· Prochaine dose :</Text>{v.nextDose.toLocaleDateString("fr-FR")}
                  </Text>
                )}
              </Text>
            </View>
            <Text
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                v.status === "completed"
                  ? "bg-green-500/20 text-green-400"
                  : v.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
              }`}
            >
              {v.status === "completed"
                ? "Fait"
                : v.status === "pending"
                  ? "À venir"
                  : "En retard"}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
