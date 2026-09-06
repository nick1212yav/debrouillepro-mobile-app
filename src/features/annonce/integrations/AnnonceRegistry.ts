import type { Annonce } from "../types";

export interface AnnonceSource {
  type: string;
  label: string;
  icon: string;
  adapt: (data: any) => Partial<Annonce>;
}

class AnnonceRegistry {
  private sources = new Map<string, AnnonceSource>();

  register(source: AnnonceSource) {
    this.sources.set(source.type, source);
  }

  getSource(type: string) {
    return this.sources.get(type);
  }

  getAllSources() {
    return Array.from(this.sources.values());
  }

  adapt(type: string, data: any): Partial<Annonce> | null {
    const source = this.sources.get(type);
    if (!source) return null;
    return source.adapt(data);
  }
}

export const annonceRegistry = new AnnonceRegistry();

// Exemple d'enregistrement depuis le module Immobilier
// (à appeler dans le module immobilier)
export function registerImmoSource() {
  annonceRegistry.register({
    type: "immo",
    label: "Immobilier",
    icon: "🏠",
    adapt: (property: any) => ({
      title: property.title,
      description: property.description,
      price: property.price,
      currency: property.currency || "USD",
      images: property.images || [],
      location: property.city,
      latitude: property.latitude,
      longitude: property.longitude,
      tags: ["immobilier", property.type],
      condition: property.condition,
      ownerId: property.ownerId,
      ownerName: property.ownerName,
      ownerAvatar: property.ownerAvatar,
      ownerPhone: property.ownerPhone,
    }),
  });
}
