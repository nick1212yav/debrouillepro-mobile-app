import type { Accommodation } from "../types/accommodation.types";

export class AccommodationBridge {
  static formatAccommodation(raw: any): Accommodation {
    return {
      id: raw.id || String(raw._id),
      type: raw.type || "Appartement",
      title: raw.title || "",
      description: raw.description || "",
      location: {
        country: raw.location?.country || "Côte d'Ivoire",
        city: raw.location?.city || "Abidjan",
        district: raw.location?.district || "",
        address: raw.location?.address || "",
      },
      pricing: {
        amount: raw.pricing?.amount || raw.price || 0,
        currency: raw.pricing?.currency || "FCFA",
        period: raw.pricing?.period || raw.period || "night",
      },
      capacity: {
        guests: raw.capacity?.guests || raw.guests || 2,
      },
      rooms: {
        bedrooms: raw.rooms?.bedrooms || raw.rooms || 1,
        bathrooms: raw.rooms?.bathrooms || raw.baths || 1,
        beds: raw.rooms?.beds || raw.beds || 1,
      },
      area: raw.area || 0,
      amenities: raw.amenities || [],
      images: raw.images || (raw.image ? [raw.image] : []),
      rating: raw.rating || 5,
      reviewsCount: raw.reviewsCount || raw.reviews || 0,
      available: raw.available !== undefined ? raw.available : true,
      host: {
        id: raw.host?.id || "unknown",
        name: raw.host?.name || raw.host || "Hôte",
        avatar: raw.host?.avatar || raw.hostAvatar || undefined,
        verified: raw.host?.verified || false,
        responseRate: raw.host?.responseRate || undefined,
      },
      tag: raw.tag || undefined,
    };
  }
}
