import type { RestaurantDetail } from "./types/restaurant.types";

export class RestaurationAdapter {
  /**
   * Mappe les données brutes provenant de la base de données vers le format d'échange TypeScript
   */
  public static mapToClientFormat(dbRecord: any): RestaurantDetail {
    return {
      id: dbRecord._id || dbRecord.id,
      name: dbRecord.restaurant_name || dbRecord.name,
      cuisine: dbRecord.cuisine_category || dbRecord.cuisine || "Africaine",
      location: dbRecord.address || dbRecord.location,
      rating: dbRecord.avg_rating || dbRecord.rating || 4.5,
      reviewsCount: dbRecord.reviewsCount || dbRecord.reviews_count || 0, // Correction de l'erreur TS2741
      priceRange: dbRecord.price_scale || dbRecord.priceRange || "$$",
      deliveryTime: dbRecord.deliveryTime || "25-35 min",
      deliveryFee: dbRecord.deliveryFee || 1000,
      image: dbRecord.image || "",
      gallery: dbRecord.gallery || [],
      tags: dbRecord.tags || [],
      open: dbRecord.open ?? true,
      openingHours: dbRecord.openingHours || "11:00 - 23:30",
      minOrder: dbRecord.minOrder || 2000,
      speciality: dbRecord.speciality || "",
      description: dbRecord.description || "",
      menu: (dbRecord.menu_groups || dbRecord.menu || []).map((grp: any) => ({
        category: grp.title || grp.category,
        items: (grp.dishes || grp.items || []).map((dish: any) => ({
          name: dish.label || dish.name,
          price: dish.price_unit || dish.price,
          description: dish.desc || dish.description || "",
          tag: dish.badge || dish.tag || "",
          calories: dish.energy_kcal || dish.calories || 350,
          prepTime: dish.prep_duration || dish.prepTime || "15 min",
          allergens: dish.allergens || [],
          dietaryRestrictions:
            dish.restrictions || dish.dietaryRestrictions || [],
          category: grp.title || grp.category,
        })),
      })),
    };
  }
}
