export type RestaurationRole =
  | "client"
  | "courier"
  | "restaurant_owner"
  | "chef"
  | "administrator";

export class RestaurationPermissions {
  private static readonly POLICY_MATRIX: Record<RestaurationRole, string[]> = {
    client: [
      "RESTAURANT_VIEW",
      "RESTAURANT_ORDER",
      "RESTAURANT_BOOK",
      "RESTAURANT_REVIEW",
    ],
    courier: ["RESTAURANT_VIEW", "DELIVERY_ACCEPT", "DELIVERY_UPDATE_STATUS"],
    restaurant_owner: [
      "RESTAURANT_VIEW",
      "RESTAURANT_MANAGE_MENU",
      "RESTAURANT_MANAGE_ORDERS",
      "RESTAURANT_VIEW_REVENUES",
      "RESTAURANT_MANAGE_PROMOTIONS",
    ],
    chef: ["RESTAURANT_VIEW", "CHEF_MANAGE_PROFILE", "CHEF_RECEIVE_BOOKINGS"],
    administrator: [
      "RESTAURANT_VIEW",
      "RESTAURANT_ORDER",
      "RESTAURANT_BOOK",
      "RESTAURANT_REVIEW",
      "RESTAURANT_MANAGE_MENU",
      "RESTAURANT_MANAGE_ORDERS",
      "RESTAURANT_VIEW_REVENUES",
      "RESTAURANT_MANAGE_PROMOTIONS",
      "DELIVERY_ACCEPT",
      "CHEF_MANAGE_PROFILE",
      "MODULE_BYPASS_FEE",
    ],
  };

  /**
   * Vérifie si le rôle de l'utilisateur détient l'autorisation requise
   */
  public static hasPermission(
    role: RestaurationRole,
    permission: string,
  ): boolean {
    const permissions = this.POLICY_MATRIX[role];
    if (!permissions) return false;
    return permissions.includes(permission);
  }

  /**
   * Valide si un restaurateur est bien le propriétaire de la ressource
   */
  public static canManageRestaurant(
    userId: string,
    restaurantOwnerId: string,
    role: RestaurationRole,
  ): boolean {
    if (role === "administrator") return true;
    return role === "restaurant_owner" && userId === restaurantOwnerId;
  }
}
