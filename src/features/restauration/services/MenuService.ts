import type { RestaurantDetail } from "../types/restaurant.types";
import type { MenuItem, MenuCategory } from "../types/menu.types";
import { MenuValidator } from "../validators/menu.validator";
import { RestaurantService } from "./RestaurantService";

export class MenuService {
  public static async addCategory(
    restaurantId: number,
    categoryName: string,
  ): Promise<boolean> {
    const restaurant = await RestaurantService.getById(restaurantId);
    if (!restaurant) return false;

    const categoryExists = restaurant.menu.some(
      (m) => m.category.toLowerCase() === categoryName.toLowerCase(),
    );
    if (categoryExists) return false;

    restaurant.menu.push({
      category: categoryName,
      items: [],
    });
    return true;
  }

  public static async addMenuItem(
    restaurantId: number,
    categoryName: string,
    itemData: Partial<MenuItem>,
  ) {
    const validation = MenuValidator.validateItem(itemData);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const restaurant = await RestaurantService.getById(restaurantId);
    if (!restaurant) {
      return {
        success: false,
        errors: { global: "Le restaurant spécifié est introuvable." },
      };
    }

    const category = restaurant.menu.find(
      (m) => m.category.toLowerCase() === categoryName.toLowerCase(),
    );
    if (!category) {
      return {
        success: false,
        errors: { global: "La catégorie ciblée n'existe pas." },
      };
    }

    const newItem: MenuItem = {
      name: itemData.name!,
      price: itemData.price!,
      description: itemData.description!,
      tag: itemData.tag || "",
      calories: itemData.calories || 300,
      prepTime: itemData.prepTime || "15 min",
      allergens: itemData.allergens || [],
      dietaryRestrictions: itemData.dietaryRestrictions || [],
      isVeggie: itemData.isVeggie ?? false,
      category: categoryName,
      nutrition: itemData.nutrition,
      costToProduce:
        itemData.costToProduce || Math.round(itemData.price! * 0.4),
    };

    category.items.push(newItem);
    return { success: true, item: newItem };
  }
}
