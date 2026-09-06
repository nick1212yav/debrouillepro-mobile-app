// src/features/immo/hooks/useImmoPublication.ts
import type { ImmoPublication, PropertyMedia } from "../types";

type ParsedMeta = {
  propertyId?: string;
  type?: string;
  transactionType?: string;
  price?: number;
  currency?: string;
  surface?: number;
  rooms?: number;
  bathrooms?: number;
  city?: string;
  neighborhood?: string;
  amenities?: string[];
  images?: string[] | string; // ✅ peut être une chaîne ou un tableau
  videos?: string[];
  status?: string;
  phone?: string;
  virtualTourUrl?: string;
  floorPlanUrl?: string;
  tour360Images?: string[];
};

export interface ImmoMetadata {
  propertyId: string | null;
  type: string;
  transactionType: string;
  price: number | null;
  currency: string;
  surface: number | null;
  rooms: number | null;
  bathrooms: number | null;
  city: string;
  neighborhood: string | null;
  amenities: string[];
  images: string[];
  videos: string[];
  status: string;
  description: string;
  authorName: string | null;
  authorAvatar: string | null;
  createdAt: number;
  phone: string | null;
  media: PropertyMedia[];
  virtualTourUrl?: string | null;
  floorPlanUrl?: string | null;
  tour360Images?: string[];
}

// ✅ Normalise une entrée d'image (tableau ou chaîne) en tableau d'URLs
function normalizeImages(input: unknown): string[] {
  if (!input) return [];

  // Si c'est déjà un tableau, on filtre les éléments vides
  if (Array.isArray(input)) {
    return input
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  // Si c'est une chaîne, on regarde si elle contient des virgules
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];

    // Si elle contient une virgule, on la découpe
    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }

    // Sinon, c'est une URL unique
    return [trimmed];
  }

  return [];
}

export function useImmoPublication(publication: ImmoPublication): ImmoMetadata {
  const meta = publication.meta || {};

  let parsedMeta: ParsedMeta = {};

  if (typeof meta === "string") {
    try {
      parsedMeta = JSON.parse(meta) as ParsedMeta;
    } catch {
      parsedMeta = {};
    }
  } else {
    parsedMeta = (meta ?? {}) as ParsedMeta;
  }

  // ✅ Normalisation des images : priorité à publication.images puis meta.images
  const rawImages =
    publication.images && publication.images.length > 0
      ? publication.images
      : parsedMeta.images;

  const images = normalizeImages(rawImages);

  const videos = normalizeImages(parsedMeta.videos);

  // Construire les médias
  const media: PropertyMedia[] = [
    ...images.map((url: string, index: number) => ({
      id: `img-${index}`,
      type: "photo" as const,
      url,
      thumbnail: url,
      order: index,
      isCover: index === 0,
    })),
    ...videos.map((url: string, index: number) => ({
      id: `vid-${index}`,
      type: "video" as const,
      url,
      thumbnail: url,
      order: images.length + index,
      isCover: false,
    })),
  ];

  return {
    propertyId: parsedMeta.propertyId ?? null,
    type: parsedMeta.type ?? "appartement",
    transactionType: parsedMeta.transactionType ?? "location",
    price: parsedMeta.price ?? null,
    currency: parsedMeta.currency ?? "USD",
    surface: parsedMeta.surface ?? null,
    rooms: parsedMeta.rooms ?? null,
    bathrooms: parsedMeta.bathrooms ?? null,
    city: parsedMeta.city ?? "",
    neighborhood: parsedMeta.neighborhood ?? null,
    amenities: parsedMeta.amenities ?? [],
    images,
    videos,
    status: parsedMeta.status ?? "available",
    description: publication.description ?? "",
    authorName: publication.author?.name ?? null,
    authorAvatar: publication.author?.avatar ?? null,
    createdAt: publication._creationTime ?? Date.now(),
    phone: parsedMeta.phone ?? null,
    media,
    virtualTourUrl: parsedMeta.virtualTourUrl ?? null,
    floorPlanUrl: parsedMeta.floorPlanUrl ?? null,
    tour360Images: parsedMeta.tour360Images ?? [],
  };
}
