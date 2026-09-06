export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface PeriodComparison {
  currentValue: number;
  previousValue: number;
  percentageDiff: number;
  trend: "up" | "down" | "stable";
}

export interface TimeRange {
  open: string; // Format "HH:MM"
  close: string; // Format "HH:MM"
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
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Address {
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  additionalInfo?: string;
}
