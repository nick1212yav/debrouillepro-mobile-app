import type { TableSection } from "./enums";

export interface TableLayout {
  tableNumber: number;
  capacity: number;
  section: TableSection;
  isAvailable: boolean;
}

export interface TableReservation {
  id: string;
  restaurantId: number;
  userId: string;
  tableNumber?: number;
  bookingDate: string; // Format "YYYY-MM-DD"
  bookingTime: string; // Format "HH:MM"
  guestsCount: number;
  section: TableSection;
  specialRequest?: string;
  isCancelled: boolean;
  createdAt: string;
  updatedAt: string; // Ajout de la propriété pour corriger l'erreur TS2353
}
