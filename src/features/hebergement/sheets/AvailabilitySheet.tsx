import { View, Text, Pressable, TextInput } from "react-native";
import React, { useState } from "react";
import { X, CalendarRange, CheckCircle2 } from "lucide-react-native";

interface AvailabilitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  accommodationId: string;
  className?: string;
}

export const AvailabilitySheet: React.FC<AvailabilitySheetProps> = ({
  isOpen,
  onClose,
}) => {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleCheck = (e: unknown) => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setAvailable(true);
    }, 1000);
  };

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <View
        className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto bg-slate-950 border-t border-white/10"
      >
        <View className="flex items-center justify-between mb-5">
          <Text className="text-base font-bold flex items-center gap-2">
            <CalendarRange size={18} className="text-indigo-400" />
            <Text>Disponibilités</Text>
          </Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60"
          >
            <X size={16} />
          </Pressable>
        </View>

        <View className="flex flex-col gap-4">
          <View className="gap-3">
            <View>
              <Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block mb-1">
                Début
              </Text>
              <TextInput
               
               className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </View>
            <View>
              <Text className="text-white/40 text-[10px] uppercase font-bold tracking-wider block mb-1">
                Fin
              </Text>
              <TextInput
               
               className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </View>
          </View>

          <Pressable
            disabled={checking}
            className="w-full py-3 rounded-xl bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
          >
            {checking ? "Vérification..." : "Vérifier la disponibilité"}
          </Pressable>
        </View>

        {available !== null && (
          <View className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 mt-4 text-xs text-emerald-400">
            <CheckCircle2 size={16} />
            <Text><Text>Ce logement est disponible aux dates sélectionnées !</Text></Text>
          </View>
        )}
      </View>
    </View>
  );
};
