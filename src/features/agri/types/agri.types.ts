// src/features/agri/types/agri.types.ts
import type { Id } from "@/convex/_generated/dataModel";
import type {
  AgriCategory,
  AgriProductQuantity,
  AgriProductAvailability,
  AgriQuality,
  AgriCondition,
} from "./product.types";
import type { AgriSeller } from "./seller.types";
import type { AgriDeliveryConfig } from "./delivery.types";
import type { AgriPricingConfig } from "./pricing.types";

export interface AgriProduct {
  _id: Id<"agriProducts">;
  _creationTime: number;
  id?: string; // ✅ Ajouté pour assurer la compatibilité structurelle d'affectation dans PublicationRenderer.tsx
  title: string;
  description: string;
  category: AgriCategory;
  subcategory?: string;
  variety?: string;
  quality: AgriQuality;
  condition?: AgriCondition;

  quantity: AgriProductQuantity;
  pricing: AgriPricingConfig;
  availability: AgriProductAvailability;

  media: {
    images: string[];
    videos?: string[];
  };

  location: {
    country: string;
    province?: string;
    city: string;
    territory?: string;
    coordinates?: { lat: number; lng: number };
  };

  seller: AgriSeller;
  delivery: AgriDeliveryConfig;

  stats: {
    views: number;
    favorites: number;
    contacts: number;
  };
}
