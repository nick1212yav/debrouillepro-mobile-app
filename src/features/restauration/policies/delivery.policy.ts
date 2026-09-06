import type { DeliveryTracker } from "../types/delivery.types";

export class DeliveryPolicy {
  private static readonly MAX_COURIER_ACTIVE_LOAD = 2;
  private static readonly AUTO_ASSIGNMENT_RADIUS_KM = 5;

  public static canAssignToCourier(
    courierActiveOrdersCount: number,
    courierStatus: "active" | "offline" | "suspended",
  ): boolean {
    if (courierStatus !== "active") return false;
    return courierActiveOrdersCount < this.MAX_COURIER_ACTIVE_LOAD;
  }

  public static isEligibleForAutoAssignment(
    distanceFromRestaurantKm: number,
  ): boolean {
    return distanceFromRestaurantKm <= this.AUTO_ASSIGNMENT_RADIUS_KM;
  }

  public static isSLAExceeded(
    tracker: DeliveryTracker,
    elapsedMinutes: number,
  ): boolean {
    const maxAllowedTime = tracker.etaMinutes + 15;
    return elapsedMinutes > maxAllowedTime;
  }
}
