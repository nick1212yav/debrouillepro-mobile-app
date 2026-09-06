import { View, Text } from "react-native";
// src/features/transport/components/detail/TransportAccessibility.tsx
import { ShieldCheck, Info } from "lucide-react-native";

interface TransportAccessibilityProps {
  wheelchairAccessible?: boolean;
  assistanceProvided?: boolean;
}

export function TransportAccessibility({
  wheelchairAccessible = true,
  assistanceProvided = true,
}: TransportAccessibilityProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 text-white">
      <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
        Accessibilité [2]
      </Text>

      <View className="space-y-3">
        {wheelchairAccessible && (
          <View className="flex items-start gap-3">
            <View className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
              <ShieldCheck size={14} />
            </View>
            <View>
              <Text className="text-xs font-bold text-white">
                Accès fauteuil roulant [2]
              </Text>
              <Text className="text-[10px] text-white/40 leading-relaxed mt-0.5">
                Le coffre ou l'habitacle de ce véhicule permet d'accueillir un
                fauteuil roulant pliable [2].
              </Text>
            </View>
          </View>
        )}

        {assistanceProvided && (
          <View className="flex items-start gap-3">
            <View className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
              <Info size={14} className="text-violet-400" />
            </View>
            <View>
              <Text className="text-xs font-bold text-white">
                <Text>Aide à l'embarquement [2]</Text></Text>
              <Text className="text-[10px] text-white/40 leading-relaxed mt-0.5">
                <Text>Le conducteur s'engage à vous aider physiquement à vous installer à bord et à ranger vos équipements de mobilité [2].</Text></Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
