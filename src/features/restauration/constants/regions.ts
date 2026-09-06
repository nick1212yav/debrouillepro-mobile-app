export interface OperatingRegion {
  id: string;
  name: string;
  city: string;
  country: string;
  deliveryFeeMultiplier: number;
  centerCoordinates: { lat: number; lng: number };
}

export const OPERATING_REGIONS: OperatingRegion[] = [
  {
    id: "cocody",
    name: "Cocody (Riviera, Angré, II Plateaux)",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    deliveryFeeMultiplier: 1.0, // Tarif de base
    centerCoordinates: { lat: 5.3484, lng: -3.9785 },
  },
  {
    id: "marcory",
    name: "Marcory (Zone 4, Bietry)",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    deliveryFeeMultiplier: 1.15, // Zone à forte congestion
    centerCoordinates: { lat: 5.3023, lng: -3.9934 },
  },
  {
    id: "plateau",
    name: "Plateau (Centre d'Affaires)",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    deliveryFeeMultiplier: 1.2,
    centerCoordinates: { lat: 5.3234, lng: -4.0156 },
  },
  {
    id: "yopougon",
    name: "Yopougon (Siporex, Niangon)",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    deliveryFeeMultiplier: 0.9, // Zone à forte densité routière facilitant la livraison
    centerCoordinates: { lat: 5.3409, lng: -4.0689 },
  },
];
