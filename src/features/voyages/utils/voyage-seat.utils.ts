// src/features/voyages/utils/voyage-seat.utils.ts

export interface SeatLayout {
  rows: number;
  cols: number;
  seats: {
    row: number;
    col: number;
    number: string;
    available: boolean;
    selected: boolean;
    premium?: boolean;
    window?: boolean;
    aisle?: boolean;
  }[];
}

/**
 * Génère une disposition de sièges pour un voyage
 */
export function generateSeatLayout(
  totalSeats: number,
  availableSeats: number,
): SeatLayout {
  const cols = 4;
  const rows = Math.ceil(totalSeats / cols);
  const seats = [];

  for (let i = 0; i < totalSeats; i++) {
    const row = Math.floor(i / cols) + 1;
    const col = (i % cols) + 1;
    const letter = String.fromCharCode(64 + col);
    const number = `${row}${letter}`;
    const isAvailable = i < availableSeats;

    seats.push({
      row,
      col,
      number,
      available: isAvailable,
      selected: false,
      premium: i < 4, // Premium pour les premières places
      window: col === 1 || col === cols,
      aisle: col === 2 || col === 3,
    });
  }

  return { rows, cols, seats };
}

/**
 * Vérifie si un siège est disponible
 */
export function isSeatAvailable(seat: { available: boolean }): boolean {
  return seat.available;
}

/**
 * Vérifie si un siège est sélectionné
 */
export function isSeatSelected(seat: { selected: boolean }): boolean {
  return seat.selected;
}

/**
 * Obtient le nombre de sièges sélectionnés
 */
export function getSelectedSeatCount(seats: { selected: boolean }[]): number {
  return seats.filter((s) => s.selected).length;
}

/**
 * Obtient la liste des numéros de sièges sélectionnés
 */
export function getSelectedSeatNumbers(
  seats: { selected: boolean; number: string }[],
): string[] {
  return seats.filter((s) => s.selected).map((s) => s.number);
}

/**
 * Valide la sélection de sièges
 */
export function validateSeatSelection(
  selectedCount: number,
  requiredSeats: number = 1,
): { valid: boolean; message?: string } {
  if (selectedCount === 0) {
    return { valid: false, message: "Veuillez sélectionner au moins un siège" };
  }
  if (selectedCount > requiredSeats) {
    return {
      valid: false,
      message: `Vous ne pouvez sélectionner que ${requiredSeats} siège(s)`,
    };
  }
  return { valid: true };
}

/**
 * Calcule le prix total en fonction du nombre de sièges et du prix par siège
 */
export function calculateSeatPrice(
  pricePerSeat: number,
  seats: number,
): number {
  return pricePerSeat * seats;
}

/**
 * Formate un numéro de siège (ex: 12A)
 */
export function formatSeatNumber(row: number, col: number): string {
  const letter = String.fromCharCode(64 + col);
  return `${row}${letter}`;
}

/**
 * Parse un numéro de siège (ex: 12A -> { row: 12, col: 1 })
 */
export function parseSeatNumber(
  seatNumber: string,
): { row: number; col: number } | null {
  const match = seatNumber.match(/^(\d+)([A-Z])$/);
  if (!match) return null;
  const row = parseInt(match[1], 10);
  const col = match[2].charCodeAt(0) - 64;
  return { row, col };
}
