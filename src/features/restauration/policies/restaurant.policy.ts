import type { RestaurantDetail } from "../types/restaurant.types";
import { RestaurationRole } from "../types/enums";

export class RestaurantPolicy {
  private static readonly MAX_ITEM_PRICE = 150000;
  private static readonly MIN_ITEM_PRICE = 100;

  public static canAcceptOrderAmount(
    cartAmount: number,
    restaurant: RestaurantDetail,
  ): boolean {
    return cartAmount >= restaurant.minOrder;
  }

  public static isPriceWithinSafetyBounds(price: number): boolean {
    return price >= this.MIN_ITEM_PRICE && price <= this.MAX_ITEM_PRICE;
  }

  public static canModifySettings(
    currentUserId: string,
    ownerId: string,
    userRole: RestaurationRole,
  ): boolean {
    if (userRole === RestaurationRole.ADMINISTRATOR) {
      return true;
    }
    return (
      userRole === RestaurationRole.RESTAURANT_OWNER &&
      currentUserId === ownerId
    );
  }
}
