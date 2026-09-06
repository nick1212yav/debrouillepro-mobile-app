export interface ChefProfile {
  name: string;
  bio: string;
  avatar: string;
  specialties: string[];
  experienceYears: number;
  rating: number;
  dailyRate: number; // Tarif journalier d'intervention en FCFA
  available: boolean;
}

export interface ChefBooking {
  id: string;
  chefId: string;
  userId: string;
  eventDate: string;
  guestsCount: number;
  menuSelected: string;
  specialInstructions?: string;
  totalCost: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}
