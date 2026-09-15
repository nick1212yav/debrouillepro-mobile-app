// src/features/voyages/hooks/useVoyageSeats.ts
import { useState, useCallback } from "react";

export interface Seat {
  id: string;
  number: string;
  available: boolean;
  selected?: boolean;
  premium?: boolean;
  window?: boolean;
  aisle?: boolean;
}

/**
 * Gère la sélection des sièges pour un voyage.
 * Pour l'instant, un état local simple. Plus tard, on pourra récupérer
 * la disposition depuis Convex.
 */
export function useVoyageSeats(totalSeats: number = 30) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Génère une grille de sièges simulée (pour démonstration)
  const generateSeats = useCallback((): Seat[] => {
    const seats: Seat[] = [];
    const rows = Math.ceil(totalSeats / 4);
    for (let i = 0; i < totalSeats; i++) {
      const row = Math.floor(i / 4) + 1;
      const col = (i % 4) + 1;
      const letter = String.fromCharCode(64 + col);
      const number = `${row}${letter}`;
      const available = i < totalSeats * 0.7; // 70% disponibles pour l'exemple
      seats.push({
        id: `seat-${i}`,
        number,
        available,
        selected: false,
        premium: i < 4,
        window: col === 1 || col === 4,
        aisle: col === 2 || col === 3,
      });
    }
    return seats;
  }, [totalSeats]);

  const [seats, setSeats] = useState<Seat[]>(() => generateSeats());

  const toggleSeat = useCallback((seatId: string) => {
    setSeats((prev) =>
      prev.map((seat) => {
        if (seat.id === seatId && seat.available) {
          const newSelected = !seat.selected;
          setSelectedSeats((current) => {
            if (newSelected) {
              return [...current, seat.number];
            } else {
              return current.filter((s) => s !== seat.number);
            }
          });
          return { ...seat, selected: newSelected };
        }
        return seat;
      }),
    );
  }, []);

  const resetSelection = useCallback(() => {
    setSeats((prev) => prev.map((seat) => ({ ...seat, selected: false })));
    setSelectedSeats([]);
  }, []);

  return {
    seats,
    selectedSeats,
    toggleSeat,
    resetSelection,
    totalSeats,
  };
}
