import { Pressable, View, Text } from "react-native";

// src/features/voyages/components/booking/VoyageSeatMap.tsx
import { useState } from "react";
import { Users, Armchair, Check, X } from "lucide-react-native";
import { cn } from "@/lib/utils";

interface SeatMapProps {
  totalSeats: number;
  availableSeats: number;
  selectedSeats: string[];
  onSelectSeats: (seats: string[]) => void;
  maxSelectable?: number;
}

export function VoyageSeatMap({
  totalSeats,
  availableSeats,
  selectedSeats,
  onSelectSeats,
  maxSelectable = 4,
}: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  // Générer une grille de sièges (ex: 4 colonnes, A-D)
  const columns = 4;
  const rows = Math.ceil(totalSeats / columns);
  const seatLetters = ["A", "B", "C", "D"];

  // Simuler les sièges occupés (pour la démo, on occupe aléatoirement certains sièges)
  // En production, cela viendrait de la base de données
  const occupiedSeats = new Set<string>();
  const totalOccupied = totalSeats - availableSeats;
  const occupiedCount = Math.min(totalOccupied, totalSeats - 1);
  const shuffled = Array.from(
    { length: totalSeats },
    (_, i) =>
      `${String.fromCharCode(65 + (i % columns))}${Math.floor(i / columns) + 1}`,
  );
  for (let i = 0; i < occupiedCount; i++) {
    occupiedSeats.add(shuffled[i]);
  }

  const toggleSeat = (seatId: string) => {
    if (occupiedSeats.has(seatId)) return;

    const isSelected = selectedSeats.includes(seatId);
    let newSelected: string[];
    if (isSelected) {
      newSelected = selectedSeats.filter((s) => s !== seatId);
    } else {
      if (selectedSeats.length >= maxSelectable) {
        return;
      }
      newSelected = [...selectedSeats, seatId];
    }
    onSelectSeats(newSelected);
  };

  const isSelected = (seatId: string) => selectedSeats.includes(seatId);
  const isOccupied = (seatId: string) => occupiedSeats.has(seatId);

  return (
    <View className="w-full">
      <View className="flex items-center justify-between mb-4">
        <View className="flex items-center gap-2 text-sm">
          <Armchair size={16} className="text-white/40" />
          <Text className="text-white/60">Sélectionnez vos sièges</Text>
          <Text className="text-white/40">
            ({selectedSeats.length}/{maxSelectable})
          </Text>
        </View>
        <View className="flex items-center gap-3 text-xs text-white/40">
          <Text className="flex items-center gap-1">
            <Text className="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-500/50" />
            Disponible
          </Text>
          <Text className="flex items-center gap-1">
            <Text className="w-4 h-4 rounded bg-indigo-500/50 border border-indigo-500/70" />
            Sélectionné
          </Text>
          <Text className="flex items-center gap-1">
            <Text className="w-4 h-4 rounded bg-white/10 border border-white/20" />
            Occupé
          </Text>
        </View>
      </View>

      <View className="gap-2 max-w-sm mx-auto">
        {Array.from({ length: rows }).map((_, rowIndex) => {
          return Array.from({ length: columns }).map((_, colIndex) => {
            const seatId = `${seatLetters[colIndex]}${rowIndex + 1}`;
            const seatNumber = rowIndex * columns + colIndex + 1;
            if (seatNumber > totalSeats) return null;

            const occupied = isOccupied(seatId);
            const selected = isSelected(seatId);
            const isHovered = hoveredSeat === seatId;

            return (
              <Pressable
                key={seatId}
                onPress={() => toggleSeat(seatId)}
                onMouseEnter={() => setHoveredSeat(seatId)}
                onMouseLeave={() => setHoveredSeat(null)}
                disabled={occupied}
                className={cn(
                  "relative flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                  "h-10 w-10 border",
                  occupied &&
                    "bg-white/5 border-white/10 text-white/30 cursor-not-allowed",
                  selected &&
                    "bg-indigo-500/40 border-indigo-500/60 text-white shadow-lg shadow-indigo-500/20",
                  !occupied &&
                    !selected &&
                    "bg-white/5 border-white/15 hover:bg-white/10 text-white/60",
                  isHovered &&
                    !occupied &&
                    !selected &&
                    "scale-105 border-indigo-500/30",
                )}
              >
                {seatId}
                {selected && (
                  <Check
                    size={12}
                    className="absolute -top-1 -right-1 text-indigo-300"
                  />
                )}
                {occupied && (
                  <X
                    size={10}
                    className="absolute -top-1 -right-1 text-white/20"
                  />
                )}
              </Pressable>
            );
          });
        })}
      </View>

      <View className="mt-4 text-center text-xs text-white/30">
        <View className="flex items-center justify-center gap-2">
          <Users size={14} />
          <Text><Text>Sièges restants :</Text>{availableSeats - selectedSeats.length}</Text>
        </View>
      </View>
    </View>
  );
}
