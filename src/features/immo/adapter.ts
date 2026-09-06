import type { ImmoPublication } from "./types";

export interface PropertyData {
  propertyId: string | null;
  title: string;
  description: string;
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
  images: string[]; // ✅ images extraites
  videos: string[]; // ✅ vidéos extraites
  status: string;
  phone: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  createdAt: number;
}

export function adapterPublicationToProperty(
  publication: ImmoPublication,
): PropertyData {
  const meta = publication.meta || {};
  let parsedMeta: any = {};
  if (typeof meta === "string") {
    try {
      parsedMeta = JSON.parse(meta);
    } catch {
      parsedMeta = {};
    }
  } else {
    parsedMeta = meta ?? {};
  }

  return {
    propertyId: parsedMeta.propertyId ?? null,
    title: publication.title,
    description: publication.description ?? "",
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
    images: parsedMeta.images ?? [], // ✅ Correction : extraction des images
    videos: parsedMeta.videos ?? [], // ✅ Correction : extraction des vidéos
    status: parsedMeta.status ?? "available",
    phone: parsedMeta.phone ?? null,
    authorName: publication.author?.name ?? null,
    authorAvatar: publication.author?.avatar ?? null,
    createdAt: publication._creationTime ?? Date.now(),
  };
}
