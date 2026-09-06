import { View } from "react-native";
import { OrderStatus } from "../../types/enums";
import { DeliveryDriverInfo } from "./DeliveryDriverInfo";
import { DeliveryETA } from "./DeliveryETA";
import { DeliveryMap } from "./DeliveryMap";
import type { GeoCoordinates } from "../../types/common.types";

interface DeliveryTrackerProps {
  orderId: string;
  status: OrderStatus;
  courierName: string;
  courierPhone: string;
  vehiclePlate?: string;
  courierCoordinates: GeoCoordinates;
  destinationCoordinates: GeoCoordinates;
  etaMinutes: number;
  distanceRemainingKm: number;
  speedKmh: number;
  onCallCourier: () => void;
  onChatCourier: () => void;
}

export function DeliveryTracker({
  orderId,
  status,
  courierName,
  courierPhone,
  vehiclePlate,
  courierCoordinates,
  destinationCoordinates,
  etaMinutes,
  distanceRemainingKm,
  speedKmh,
  onCallCourier,
  onChatCourier,
}: DeliveryTrackerProps) {
  const isDelivering = status === OrderStatus.IN_DELIVERY;

  return (
    <View className="space-y-4">
      {/* 1. Bloc Carte de géolocalisation */}
      <DeliveryMap
        courierCoordinates={courierCoordinates}
        destinationCoordinates={destinationCoordinates}
        height="h-56"
      />

      {/* 2. Données chiffrées de délai restant */}
      <DeliveryETA
        etaMinutes={etaMinutes}
        distanceRemainingKm={distanceRemainingKm}
        speedKmh={speedKmh}
      />

      {/* 3. Fiche d'identité et contact du coursier */}
      <DeliveryDriverInfo
        courierName={courierName}
        courierPhone={courierPhone}
        vehiclePlate={vehiclePlate}
        onCall={onCallCourier}
        onChat={onChatCourier}
      />
    </View>
  );
}
