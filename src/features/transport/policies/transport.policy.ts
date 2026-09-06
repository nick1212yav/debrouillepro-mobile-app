// src/features/transport/policies/transport.policy.ts
import type { VehicleType } from "../types";

export class TransportPolicy {
  // Limites de poids de bagages autorisées par défaut (kg)
  private static WEIGHT_LIMITS_KG: Record<VehicleType, number> = {
    moto: 5, // Uniquement sac à dos
    taxi: 30, // Valises standards
    voiture: 25, // Coffre partagé
    minibus: 15, // Surcharge restreinte
    bus: 40, // Soutes
    camion: 10000, // Logistique lourde
    livraison: 15,
  };

  // Vitesses de sécurité maximales conseillées (km/h)
  private static SAFE_SPEED_LIMITS: Record<VehicleType, number> = {
    moto: 50,
    taxi: 70,
    voiture: 80,
    minibus: 65,
    bus: 70,
    camion: 60,
    livraison: 50,
  };

  static getMaxWeightLimit(type: VehicleType): number {
    return this.WEIGHT_LIMITS_KG[type] ?? 20;
  }

  static getSafeSpeedLimit(type: VehicleType): number {
    return this.SAFE_SPEED_LIMITS[type] ?? 60;
  }
}
