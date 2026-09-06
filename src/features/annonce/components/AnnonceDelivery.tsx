import { Pressable, View, Text } from "react-native";
import { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  Package,
  Phone,
} from "lucide-react-native";

interface DeliveryStep {
  status: "pending" | "picked" | "transit" | "delivered";
  label: string;
  description?: string;
  timestamp?: number;
}

interface Props {
  trackingNumber: string;
  steps: DeliveryStep[];
  currentStatus: DeliveryStep["status"];
  estimatedDelivery?: string;
  onContactCourier?: () => void;
}

const STATUS_ORDER: DeliveryStep["status"][] = [
  "pending",
  "picked",
  "transit",
  "delivered",
];
const STATUS_LABELS: Record<
  DeliveryStep["status"],
  { label: string; color: string; icon: any }
> = {
  pending: { label: "En préparation", color: "#F59E0B", icon: Clock },
  picked: { label: "Colis pris en charge", color: "#60A5FA", icon: Package },
  transit: { label: "En transit", color: "#6366F1", icon: Truck },
  delivered: { label: "Livré", color: "#10B981", icon: CheckCircle },
};

export function AnnonceDelivery({
  trackingNumber,
  steps,
  currentStatus,
  estimatedDelivery,
  onContactCourier,
}: Props) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <View className="space-y-4">
      <View className="flex items-center gap-3">
        <Truck size={18} className="text-white/40" />
        <View className="flex-1">
          <Text className="text-white font-semibold text-sm">Suivi de livraison</Text>
          <Text className="text-white/30 text-xs">N° {trackingNumber}</Text>
        </View>
        {estimatedDelivery && (
          <View className="text-right">
            <Text className="text-white/40 text-xs">Livraison estimée</Text>
            <Text className="text-white font-bold text-sm">{estimatedDelivery}</Text>
          </View>
        )}
      </View>

      {/* Timeline */}
      <View className="space-y-2 relative pl-6">
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const status = STATUS_LABELS[step.status];
          const Icon = status.icon;

          return (
            <View key={step.status} className="relative">
              {/* Ligne verticale */}
              {index < steps.length - 1 && (
                <View
                  className="absolute left-[-6px] top-5 w-0.5 h-8"
                  style={{  }}
                />
              )}

              <View className="flex items-start gap-3">
                <View
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: isActive
                                        ? `${status.color}30`
                                        : "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                >
                  <Icon
                    size={10}
                    style={{
                      color: isActive ? status.color : "rgba(255,255,255,0.2)",
                    }}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: isActive ? "white" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {status.label}
                    {isCurrent && (
                      <Text className="ml-2 text-xs font-normal text-orange-400">
                        <Text>● En cours</Text></Text>
                    )}
                  </Text>
                  {step.description && (
                    <Text className="text-xs text-white/40">{step.description}</Text>
                  )}
                  {step.timestamp && (
                    <Text className="text-[10px] text-white/20">
                      {new Date(step.timestamp).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Contact transporteur */}
      <Pressable
        onPress={onContactCourier}
        className="w-full py-2 rounded-xl text-xs font-medium text-white/60 bg-white/5 flex items-center justify-center gap-2"
      >
        <Phone size={12} /> <Text>Contacter le transporteur</Text></Pressable>
    </View>
  );
}
