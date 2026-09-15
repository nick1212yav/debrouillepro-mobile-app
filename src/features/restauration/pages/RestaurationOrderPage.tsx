import { View, Text, Pressable, Linking } from "react-native";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  MapPin,
  Compass,
  Phone,
  MessageSquare,
  AlertCircle,
} from "lucide-react-native";

// Imports de l'architecture d'ingénierie du module
import { useDelivery } from "../hooks/useDelivery";
import { useOrder } from "../hooks/useOrder";
import { OrderService } from "../services/OrderService";
import type { OrderDetail } from "../types/order.types";
import { OrderStatus } from "../types/enums";

// Imports des composants de rendu de commandes et livraisons
import { OrderTimeline } from "../components/order/OrderTimeline";
import { OrderSummary } from "../components/order/OrderSummary";
import { DeliveryTracker } from "../components/delivery/DeliveryTracker";

interface RestaurationOrderPageProps {
  orderId: string;
  onBack: () => void;
}

export default function RestaurationOrderPage({
  orderId,
  onBack,
}: RestaurationOrderPageProps) {
  // 1. Chargement des états réactifs de commande et de livraison
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const { tracker, coordinates, speed } = useDelivery(orderId);
  const { updateOrderStatus, isProcessing } = useOrder();

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getOrder(orderId);
      if (data) {
        setOrder(data);
      }
    } catch {
      toast.error("Échec de chargement du suivi de votre commande.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    // Écoute de rafraîchissement périodique (Polling de sécurité)
    const interval = setInterval(fetchOrderDetails, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Handlers pour actions du coursier
  const handleCallCourier = () => {
    if (tracker) {
      toast.info(`Appel du coursier au ${tracker.courierPhone}`);
      Linking.openURL(`tel:${tracker.courierPhone}`);
    }
  };

  const handleChatCourier = () => {
    if (tracker) {
      toast.info(
        `Ouverture de la messagerie interne avec ${tracker.courierName}`,
      );
    }
  };

  if (loading) {
    return (
      <View className="h-full flex items-center justify-center text-white/50 text-xs gap-2"><RefreshCw size={14} className="animate-spin" /><Text>Connexion au traceur de livraison...</Text></View>
    );
  }

  if (!order) {
    return (
      <View className="h-full flex flex-col items-center justify-center gap-4 text-white/50 text-xs px-4"><AlertCircle size={24} className="text-white/20" /><Text>Données de commande introuvables ou archivées.</Text><Pressable onPress={onBack} className="px-4 py-2 bg-white/5 rounded-xl text-white"><Text>Retour</Text></Pressable></View>
    );
  }

  return (
    <View className="h-full w-full flex flex-col relative text-white bg-[#020617]">{}<View className="flex-shrink-0 px-4 pt-12 pb-3 bg-slate-950/60 border-b border-white/[0.04] backdrop-blur-md flex items-center gap-3"><Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} /></Pressable><View className="flex-1 text-left"><Text className="block text-[8px] text-white/30 uppercase font-black">Suivi en temps réel
          </Text><Text className="text-sm font-mono font-black text-white/95 leading-none mt-1">{order.id}</Text></View></View>{}<View className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">{}<View className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]"><Text className="block text-[9px] text-white/40 uppercase font-black text-left mb-4">Progression de la commande
          </Text><OrderTimeline currentStatus={order.status} /></View>{}{order.status === OrderStatus.IN_DELIVERY && tracker && coordinates && (
          <View className="space-y-4 animate-fade-in"><DeliveryTracker orderId={orderId} status={order.status} courierName={tracker.courierName} courierPhone={tracker.courierPhone} vehiclePlate={tracker.vehiclePlate} courierCoordinates={coordinates} destinationCoordinates={tracker.destinationCoordinates} etaMinutes={tracker.etaMinutes} distanceRemainingKm={tracker.distanceRemainingKm} speedKmh={speed} onCallCourier={handleCallCourier} onChatCourier={handleChatCourier} /></View>
        )}{}{order.status !== OrderStatus.IN_DELIVERY &&
          order.status !== OrderStatus.DELIVERED &&
          order.status !== OrderStatus.CANCELLED && (
            <View className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-left flex items-start gap-3"><Compass size={18} className="text-orange-400 shrink-0 mt-0.5 animate-spin" style={{  }} /><View className="min-w-0"><Text className="block text-xs font-extrabold text-white">Affectation du coursier
                </Text><Text className="text-[11px] text-white/50 leading-relaxed mt-1 font-normal">Vos plats mijotent ou sont prêts en cuisine. Notre algorithme
                  attribue actuellement le meilleur livreur disponible à
                  proximité immédiate pour assurer un transport ultra-rapide.
                </Text></View></View>
          )}{}<OrderSummary items={order.items} subtotal={order.subtotal} deliveryFee={order.deliveryFee} tax={order.tax} total={order.total} />{}<View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-left space-y-2"><Text className="block text-[8px] text-white/30 uppercase font-black">Informations de livraison
          </Text><View className="flex gap-2 items-center text-xs text-white/80"><MapPin size={14} className="text-orange-400 shrink-0" /><Text className="truncate">{order.deliveryAddress}</Text></View></View></View></View>
  );
}
