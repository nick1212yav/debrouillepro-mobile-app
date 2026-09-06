import type { Id } from "@/convex/_generated/dataModel";

export type ServiceCategory =
  | "Dépannage"
  | "Beauté"
  | "Livraison"
  | "Éducation"
  | "Photo"
  | "Bien-être"
  | "Événementiel"
  | "Ménage"
  | "Jardinage"
  | "Informatique"
  | "Plomberie"
  | "Électricité"
  | "Construction"
  | "Transport"
  | "Autre";

export type ServicePricingType = "hourly" | "daily" | "fixed" | "quote";

export interface ServiceProvider {
  _id: Id<"serviceProviders">;
  userId?: Id<"users">;
  name: string;
  category: ServiceCategory;
  specialty: string;
  location: string;
  description: string;
  price: string;
  currency: string;
  responseTime: string;
  imageUrl?: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  skills: string[];
  verified: boolean;
  available: boolean;
  urgent?: boolean;
  languages?: string[];
  experience?: string;
  certificates?: string[];
  portfolio?: string[];
  createdAt: number;
  updatedAt?: number;
  insurance?: boolean;
  warranty?: boolean;
  distance?: number;
  online?: boolean;
  lastActive?: number;
}

export interface ServiceBooking {
  _id: Id<"serviceBookings">;
  providerId: Id<"serviceProviders">;
  userId: Id<"users">;
  message: string;
  scheduledAt?: string;
  status: "pending" | "confirmed" | "done" | "cancelled";
  createdAt: number;
}
