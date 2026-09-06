export type CuisineType =
  | "Africaine"
  | "Fusion"
  | "Pizza"
  | "Café & Snack"
  | "Grillades"
  | "Européenne"
  | "Asiatique";

export type DietType =
  | "vegan"
  | "vegetarian"
  | "halal"
  | "kosher"
  | "gluten-free"
  | "none";

export type OrderStatus =
  | "pending_payment"
  | "received"
  | "preparing"
  | "ready_for_pickup"
  | "in_delivery"
  | "delivered"
  | "cancelled";

export type TableSection = "standard" | "terrace" | "vip" | "private_room";

export interface TimeSlot {
  time: string; // "12:00"
  available: boolean;
  maxCapacity: number;
}

export interface DaySchedule {
  day:
    | "lundi"
    | "mardi"
    | "mercredi"
    | "jeudi"
    | "vendredi"
    | "samedi"
    | "dimanche";
  openTime: string; // "08:00"
  closeTime: string; // "23:00"
  isClosed: boolean;
}
