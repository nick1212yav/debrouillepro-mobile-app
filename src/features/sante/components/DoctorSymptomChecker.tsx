import { View, Text } from "react-native";
// src/features/sante/components/DoctorSymptomChecker.tsx
import { useState } from "react";
import { Stethoscope, Search, Loader2 } from "lucide-react-native";

interface Symptom {
  id: string;
  label: string;
}

interface DoctorSymptomCheckerProps {
  symptoms: Symptom[];
  onCheck: (selected: string[]) => Promise<{
    condition: string;
    urgency: "low" | "medium" | "high";
    advice: string;
  }>;
}

export function DoctorSymptomChecker({
  symptoms,
  onCheck,
}: DoctorSymptomCheckerProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<{
    condition: string;
    urgency: "low" | "medium" | "high";
    advice: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleCheck = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await onCheck(selected);
      setResult(res);
    } catch {
      setResult({
        condition: "Erreur d'analyse",
        urgency: "low",
        advice: "Veuillez réessayer ou consulter directement un médecin.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20">
      <View className="flex items-center gap-2 mb-3">
        <Stethoscope size={18} className="text-teal-400" />
        <Text className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
          Vérificateur de symptômes
        </Text>
      </View>

      <Text className="text-white/40 text-xs mb-3">Sélectionnez vos symptômes :</Text>
      <View className="flex flex-wrap gap-2 mb-3">
        {symptoms.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => toggleSymptom(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selected.includes(s.id)
                ? "bg-teal-500/30 text-teal-400 border border-teal-500/40"
                : "bg-white/10 text-white/60 border border-white/10 hover:bg-white/20"
            }`}
          >
            {s.label}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleCheck}
        disabled={selected.length === 0 || loading}
        className="w-full py-2 rounded-xl bg-teal-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Search size={14} />
        )}
        {loading ? "Analyse en cours..." : "Analyser les symptômes"}
      </Pressable>

      {result && (
        <View
          className={`mt-3 p-3 rounded-xl border ${
            result.urgency === "high"
              ? "bg-red-500/20 border-red-500/30"
              : result.urgency === "medium"
                ? "bg-yellow-500/20 border-yellow-500/30"
                : "bg-green-500/20 border-green-500/30"
          }`}
        >
          <Text
            className={`font-bold text-sm ${
              result.urgency === "high"
                ? "text-red-400"
                : result.urgency === "medium"
                  ? "text-yellow-400"
                  : "text-green-400"
            }`}
          >
            {result.condition}
          </Text>
          <Text className="text-white/70 text-xs mt-1">{result.advice}</Text>
          <Text
            className={`text-[10px] mt-1 ${
              result.urgency === "high"
                ? "text-red-400"
                : result.urgency === "medium"
                  ? "text-yellow-400"
                  : "text-green-400"
            }`}
          >
            {result.urgency === "high"
              ? "⚠️ Consultez en urgence"
              : result.urgency === "medium"
                ? "📅 Consultez rapidement"
                : "✅ Surveillez l'évolution"}
          </Text>
        </View>
      )}
    </View>
  );
}
