import { View, Text, Pressable } from "react-native";
import { ShieldAlert, CheckCircle2, Siren } from "lucide-react-native";
import { toast } from "sonner";

export function TransportSafety() {
  const checklist = [
    "Conducteur entièrement vérifié",
    "Permis de conduire valide RDC",
    "Identité nationale certifiée",
    "Assurance passager AXA RDC",
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center justify-between"><Text className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert size={12} />Sécurité certifiée
        </Text><Pressable onPress={() =>
            toast.error("SOS : Alerte de détresse de voyage envoyée.")} className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/15 border border-red-500/20 px-2 py-1 rounded-lg font-bold"><Siren size={10} /><Text>Bouton SOS</Text></Pressable></View><View className="gap-2 text-[11px] text-white/70">{checklist.map((item) => (
          <View key={item} className="flex items-center gap-1.5">
            <CheckCircle2
              size={12}
              className="text-emerald-400 flex-shrink-0"
            />
            <Text className="truncate">{item}</Text>
          </View>
        ))}</View></View>
  );
}
