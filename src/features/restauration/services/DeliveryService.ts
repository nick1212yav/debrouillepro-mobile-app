import type { DeliveryTracker } from "../types/delivery.types";
import { OrderService } from "./OrderService";
import { OrderStatus } from "../types/enums";
import { DeliveryLocationTracker } from "../tracking/DeliveryLocationTracker";

export class DeliveryService {
  private static trackers: Map<string, DeliveryTracker> = new Map();
  private static locationHandlers: Map<string, DeliveryLocationTracker> =
    new Map();

  public static async assignCourier(
    orderId: string,
    courierData: {
      id: string;
      name: string;
      phone: string;
      plate?: string;
    },
  ): Promise<boolean> {
    const order = await OrderService.getOrder(orderId);
    if (!order) return false;

    const startCoordinates = { lat: 5.3484, lng: -3.9785 };
    const destinationCoordinates = { lat: 5.3524, lng: -3.9855 };

    const trackerPayload: DeliveryTracker = {
      deliveryId: `DEL-${Date.now().toString().slice(-4)}`,
      orderId,
      courierId: courierData.id,
      courierName: courierData.name,
      courierPhone: courierData.phone,
      vehiclePlate: courierData.plate,
      currentCoordinates: startCoordinates,
      destinationCoordinates,
      etaMinutes: 20,
      distanceRemainingKm: 2.8,
      speedKmh: 0,
    };

    this.trackers.set(orderId, trackerPayload);

    const locTracker = new DeliveryLocationTracker(
      trackerPayload.deliveryId,
      startCoordinates,
    );
    this.locationHandlers.set(orderId, locTracker);

    locTracker.onLocationUpdate((newCoordinates, speed) => {
      const activeTracker = this.trackers.get(orderId);
      if (activeTracker) {
        activeTracker.currentCoordinates = newCoordinates;
        activeTracker.speedKmh = speed;
        this.trackers.set(orderId, activeTracker);
      }
    });

    await OrderService.updateStatus(orderId, OrderStatus.IN_DELIVERY);
    return true;
  }

  public static getTracker(orderId: string): DeliveryTracker | null {
    return this.trackers.get(orderId) || null;
  }

  public static getLocationHandler(
    orderId: string,
  ): DeliveryLocationTracker | null {
    return this.locationHandlers.get(orderId) || null;
  }
}
