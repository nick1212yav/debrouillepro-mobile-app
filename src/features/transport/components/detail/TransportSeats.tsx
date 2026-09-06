import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text } from "react-native";
// src/features/transport/components/detail/TransportSeats.tsx
import { useState } from "react";
import { Users, Armchair } from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface TransportSeatsProps {
  totalSeats: number;
  onSelectSeat?: (seatNumber: number) => void;
}

export function TransportSeats({
  totalSeats = 4,
  onSelectSeat,
}: TransportSeatsProps) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const handleSeatClick = (seatNum: number) => {
    setSelectedSeat(seatNum);
    if (onSelectSeat) onSelectSeat(seatNum);
    UIService.openToast(`Siège N°${seatNum} sélectionné ! [2]`, "success");
  };

  // Simuler des sièges occupés
  const occupiedSeats = [2];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
      <Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">
        Plan de cabine (Sièges) [2]
      </Text>

      <View className="flex flex-col items-center gap-6 py-4 bg-black/40 rounded-2xl border border-white/5">
        {/* Volant du chauffeur */}
        <View className="w-8 h-8 rounded-full border-4 border-white/10 flex items-center justify-center self-end mr-12 text-white/30 text-[9px] font-bold">
          <Text>Volant [2]</Text></View>

        {/* Grille de sièges */}
        <View className="gap-4">
          {Array.from({ length: totalSeats }).map((_, i) => {
            const seatNum = i + 1;
            const isOccupied = occupiedSeats.includes(seatNum);
            const isSelected = selectedSeat === seatNum;

            return (
              <Pressable
                key={seatNum}
                disabled={isOccupied}
                onPress={() => handleSeatClick(seatNum)}
                className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                  isOccupied
                    ? "bg-white/5 border-white/5 text-white/10 cursor-not-allowed"
                    : isSelected
                      ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                      : "bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/10"
                }`}
              >
                <Armchair size={16} />
                <Text className="text-[8px] font-bold mt-0.5">{seatNum}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
