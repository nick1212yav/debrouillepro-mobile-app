// src/features/agri/types/delivery.types.ts
export interface AgriDeliveryConfig {
  available: boolean;
  radius?: number; // Rayon d'action maximal autorisé en km
  price?: number; // Forfait ou coût de base de transport
  pickupAvailable: boolean;
}
