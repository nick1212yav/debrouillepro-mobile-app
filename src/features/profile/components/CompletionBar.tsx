import { View, Text, Pressable } from "react-native";

// src/features/profile/components/CompletionBar.tsx

import { useState } from "react";
import { ChevronRight, Check } from "lucide-react-native";
import { toast } from "sonner";

interface CompletionBarProps {
  accentHex: string;
  hasName: boolean;
  hasBio: boolean;
}

export function CompletionBar({
  accentHex,
  hasName,
  hasBio,
}: CompletionBarProps) {
  const [expanded, setExpanded] = useState(false);

  const steps = [
    { id: "photo", label: "Photo de profil", emoji: "📸", done: true },
    { id: "name", label: "Nom renseigné", emoji: "✍️", done: hasName },
    { id: "bio", label: "Bio remplie", emoji: "📝", done: hasBio },
    { id: "skills", label: "3 compétences", emoji: "⚡", done: false },
    { id: "verified", label: "Identité vérifiée", emoji: "🛡️", done: true },
  ];
  const pct = Math.round(
    (steps.filter((s) => s.done).length / steps.length) * 100,
  );

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl p-4 mb-4" onPress={() => setExpanded((p) => !p)} style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
      <View className="flex items-center justify-between mb-2"><Text className="text-sm font-bold text-white">Profil complété</Text><View className="flex items-center gap-2"><Text className="font-black text-sm" style={{ color: accentHex }}>{pct}%
          </Text><ChevronRight size={14} className="text-white/30" style={{ transform: expanded ? "rotate(90deg)" : "none" }} /></View></View>
      <View className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><View initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} className="h-full rounded-full" style={{  }} /></View>
      {pct < 100 && (
        <Text className="text-xs text-white/40">{steps.filter((s) => !s.done).length}étape
          {steps.filter((s) => !s.done).length > 1 ? "s" : ""}restante
          {steps.filter((s) => !s.done).length > 1 ? "s" : ""}pour un profil
          parfait
        </Text>
      )}
<View>
        {expanded && (
          <View initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
            <View className="flex flex-col gap-2 pt-1 border-t border-white/5">{steps.map((step) => (
                <View key={step.id} className="flex items-center gap-3"><View className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: step.done
                                        ? `${accentHex}25`
                                        : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{step.done ? (
                      <Check size={11} style={{  }} />
                    ) : (
                      <Text className="text-[10px]">{step.emoji}</Text>
                    )}</View><Text className="text-xs" style={{
                      color: step.done
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(255,255,255,0.35)",
                    }}>{step.label}</Text>{!step.done && (
                    <Pressable className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full" onPress={(e) => {
                        toast.info("Modifiable via Modifier le profil");
                      }} style={{ backgroundColor: `${accentHex}20` }}>
                      Compléter
                    </Pressable>
                  )}</View>
              ))}</View>
          </View>
        )}
      </View>
    </View>
  );
}
