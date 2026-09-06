import type { Accommodation } from "../types/accommodation.types";

interface FilterCriteria {
  type?: string;
  maxPrice?: number;
  city?: string;
  amenities?: string[];
  minBedrooms?: number;
}

export class FilterUtils {
  static filterAccommodations(
    items: Accommodation[],
    criteria: FilterCriteria,
  ): Accommodation[] {
    return items.filter((item) => {
      // Filtrage par type
      if (
        criteria.type &&
        criteria.type !== "Tout" &&
        item.type.toLowerCase() !== criteria.type.toLowerCase()
      ) {
        return false;
      }

      // Filtrage par prix max
      if (criteria.maxPrice && item.pricing.amount > criteria.maxPrice) {
        return false;
      }

      // Filtrage par ville
      if (
        criteria.city &&
        criteria.city.trim() !== "" &&
        item.location.city.toLowerCase() !== criteria.city.toLowerCase()
      ) {
        return false;
      }

      // Filtrage par équipements
      if (criteria.amenities && criteria.amenities.length > 0) {
        const hasAllAmenities = criteria.amenities.every((amenity) =>
          item.amenities
            .map((a) => a.toLowerCase())
            .includes(amenity.toLowerCase()),
        );
        if (!hasAllAmenities) return false;
      }

      // Filtrage par nombre de chambres
      if (criteria.minBedrooms && item.rooms.bedrooms < criteria.minBedrooms) {
        return false;
      }

      return true;
    });
  }
}
