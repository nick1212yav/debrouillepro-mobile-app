// src/features/transport/subtypes.ts
import type { VehicleType } from "./types";

export interface TransportSubtype {
  id: string;
  parentType: VehicleType;
  label: string;
  capacityRange: { min: number; max: number };
  baseMultiplier: number;
}

export const TRANSPORT_SUBTYPES: TransportSubtype[] = [
  {
    id: "taxi-classic",
    parentType: "taxi",
    label: "Taxi individuel standard",
    capacityRange: { min: 1, max: 4 },
    baseMultiplier: 1.0,
  },
  {
    id: "taxi-vip",
    parentType: "taxi",
    label: "Taxi Privé / Berline VIP",
    capacityRange: { min: 1, max: 4 },
    baseMultiplier: 1.6,
  },
  {
    id: "moto-classic",
    parentType: "moto",
    label: "Moto-Taxi Solo",
    capacityRange: { min: 1, max: 1 },
    baseMultiplier: 1.0,
  },
  {
    id: "moto-cargo",
    parentType: "moto",
    label: "Moto de livraison (Kekenou)",
    capacityRange: { min: 0, max: 0 },
    baseMultiplier: 0.9,
  },
  {
    id: "bus-coac",
    parentType: "bus",
    label: "Autocar inter-urbain climatisé",
    capacityRange: { min: 30, max: 70 },
    baseMultiplier: 1.2,
  },
];
