import type { Doc } from "@/convex/_generated/dataModel";
import type { ServiceProvider, ServiceCategory } from "./types";

export function adaptServiceProvider(
  doc: Doc<"serviceProviders">,
): ServiceProvider {
  return {
    _id: doc._id,
    userId: doc.userId,
    name: doc.name,
    category: doc.category as ServiceCategory,
    specialty: doc.specialty,
    location: doc.location,
    description: doc.description,
    price: doc.price,
    currency: doc.currency || "USD",
    responseTime: doc.responseTime,
    imageUrl: doc.imageUrl,
    coverImage: doc.coverImage,
    rating: doc.rating || 0,
    reviewCount: doc.reviewCount || 0,
    skills: doc.skills || [],
    verified: doc.verified || false,
    available: doc.available || false,
    urgent: doc.urgent || false,
    languages: doc.languages || [],
    experience: doc.experience || "",
    certificates: doc.certificates || [],
    portfolio: doc.portfolio || [],
    updatedAt: doc.updatedAt || doc._creationTime,
    insurance: doc.insurance || false,
    warranty: doc.warranty || false,
    online: doc.online || false,
    lastActive: doc.lastActive || Date.now(),
    createdAt: doc._creationTime,
  };
}

/**
 * Adapte une publication (type "service") en ServiceProvider
 * pour l'affichage dans le feed ou la page détail.
 */
export function adaptServiceFromPublication(
  publication: Doc<"publications">,
): ServiceProvider | null {
  if (publication.type !== "service") return null;

  let meta: any = {};
  if (publication.meta) {
    try {
      meta =
        typeof publication.meta === "string"
          ? JSON.parse(publication.meta)
          : publication.meta;
    } catch {
      meta = {};
    }
  }

  return {
    _id: meta.providerId || publication._id,
    userId: publication.authorId,
    name: publication.title,
    category: (meta.category || "Services") as ServiceCategory,
    specialty: meta.specialty || "",
    location: publication.location || "",
    description: publication.description || "",
    price: meta.price || publication.price || "",
    currency: meta.currency || "USD",
    responseTime: meta.responseTime || "Sur demande",
    // ✅ Récupère la première image depuis publication.images ou meta
    imageUrl: publication.images?.[0] || meta.imageUrl,
    coverImage: meta.coverImage,
    rating: meta.rating || 0,
    reviewCount: meta.reviewCount || 0,
    skills: meta.skills || [],
    verified: meta.verified || false,
    available: meta.available !== false,
    urgent: meta.urgent || false,
    languages: meta.languages || [],
    experience: meta.experience || "",
    certificates: meta.certificates || [],
    // ✅ Portfolio = publication.images OU meta.portfolio
    portfolio:
      publication.images?.length > 0
        ? publication.images
        : meta.portfolio || [],
    updatedAt: publication._creationTime,
    insurance: meta.insurance || false,
    warranty: meta.warranty || false,
    online: meta.online || false,
    lastActive: meta.lastActive || Date.now(),
    createdAt: publication._creationTime,
  };
}
