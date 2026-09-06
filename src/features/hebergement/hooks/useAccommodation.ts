// src/features/hebergement/hooks/useAccommodation.ts
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Accommodation } from "../types/accommodation.types";

export const MOCK_ACCOMMODATIONS: Accommodation[] = [
  {
    id: "1",
    type: "Appartement",
    title: "Appartement Vue Mer",
    description:
      "Superbe appartement moderne avec vue panoramique sur la lagune de Cocody. Entièrement équipé et sécurisé.",
    location: {
      country: "Côte d'Ivoire",
      city: "Abidjan",
      district: "Cocody",
      address: "Rue des Ambassades",
    },
    pricing: { amount: 450000, currency: "FCFA", period: "month" },
    capacity: { guests: 4 },
    rooms: { bedrooms: 3, bathrooms: 2, beds: 3 },
    area: 95,
    amenities: ["wifi", "parking", "cuisine", "piscine", "climatisation"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    ],
    rating: 4.8,
    reviewsCount: 124,
    available: true,
    host: { id: "host-1", name: "Marie K.", verified: true, responseRate: 98 },
    tag: "Premium",
  },
  {
    id: "2",
    type: "Villa",
    title: "Villa Familiale Cocody",
    description:
      "Villa de standing avec jardin, piscine privée et sécurité 24h/24 dans un quartier paisible de la Riviera.",
    location: {
      country: "Côte d'Ivoire",
      city: "Abidjan",
      district: "Riviera",
      address: "Riviera 3",
    },
    pricing: { amount: 850000, currency: "FCFA", period: "month" },
    capacity: { guests: 8 },
    rooms: { bedrooms: 5, bathrooms: 3, beds: 5 },
    area: 220,
    amenities: [
      "wifi",
      "parking",
      "cuisine",
      "piscine",
      "climatisation",
      "gym",
    ],
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
    ],
    rating: 4.9,
    reviewsCount: 87,
    available: true,
    host: {
      id: "host-2",
      name: "Jean-Paul A.",
      verified: true,
      responseRate: 100,
    },
    tag: "Coup de cœur",
  },
  {
    id: "3",
    type: "Studio",
    title: "Studio Centre-Ville",
    description:
      "Studio tout équipé, idéal pour professionnel en déplacement au Plateau. Proche de toutes commodités.",
    location: {
      country: "Côte d'Ivoire",
      city: "Abidjan",
      district: "Plateau",
      address: "Avenue Chardy",
    },
    pricing: { amount: 180000, currency: "FCFA", period: "month" },
    capacity: { guests: 2 },
    rooms: { bedrooms: 1, bathrooms: 1, beds: 1 },
    area: 35,
    amenities: ["wifi", "cuisine", "climatisation", "tv"],
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
    ],
    rating: 4.5,
    reviewsCount: 203,
    available: true,
    host: {
      id: "host-3",
      name: "Sophie M.",
      verified: false,
      responseRate: 90,
    },
    tag: "Économique",
  },
];

export function useAccommodation(id?: string) {
  const [accommodation, setAccommodation] = useState<Accommodation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Requête asynchrone sécurisée sur la base de données Convex [2]
  const rawAccommodation = useQuery(
    api.hebergement.getAccommodation,
    id ? { id } : "skip",
  );

  useEffect(() => {
    if (id === undefined) {
      setLoading(false);
      return;
    }

    if (rawAccommodation === undefined) {
      setLoading(true);
      return;
    }

    if (rawAccommodation === null) {
      setError("Hébergement introuvable");
      setAccommodation(null);
      setLoading(false);
      return;
    }

    try {
      // Normalisation du document plat Convex vers l'interface TypeScript attendue par le Front-end [2]
      const mapped: Accommodation = {
        id: rawAccommodation._id,
        title: rawAccommodation.title,
        description: rawAccommodation.description,
        type:
          rawAccommodation.type.charAt(0).toUpperCase() +
          rawAccommodation.type.slice(1),
        images: rawAccommodation.images || [],
        location: {
          country: (rawAccommodation as any).country || "Côte d'Ivoire",
          city: rawAccommodation.city,
          district: (rawAccommodation as any).district || "",
          address: rawAccommodation.address || "",
          latitude: rawAccommodation.latitude,
          longitude: rawAccommodation.longitude,
        },
        pricing: {
          amount: rawAccommodation.price,
          currency: rawAccommodation.currency || "FCFA",
          period: "night",
        },
        capacity: {
          guests: rawAccommodation.maxGuests || 2,
        },
        rooms: {
          bedrooms: (rawAccommodation as any).bedrooms || 1,
          bathrooms: (rawAccommodation as any).bathrooms || 1,
          beds: (rawAccommodation as any).beds || 1,
        },
        area: (rawAccommodation as any).area || 45,
        amenities: rawAccommodation.amenities || [],
        rating: rawAccommodation.rating ?? 5.0,
        reviewsCount: rawAccommodation.reviewCount ?? 0,
        available: rawAccommodation.available ?? true,
        host: {
          id: rawAccommodation.hostId,
          name: (rawAccommodation as any).hostName || "Hôte",
          avatar: (rawAccommodation as any).hostAvatar || "",
          verified: true,
          responseRate: 100,
        },
      };

      setAccommodation(mapped);
      setError(null);
    } catch (err: any) {
      setError("Erreur d'interprétation des données");
      setAccommodation(null);
    } finally {
      setLoading(false);
    }
  }, [id, rawAccommodation]);

  return { accommodation, loading, error };
}
