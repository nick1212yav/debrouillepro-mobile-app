import { Text } from "react-native";
import { OrderStatus as StatusEnum } from "../../types/enums";
import {
  Clock,
  CheckCircle,
  Flame,
  ShieldAlert,
  Truck,
  Sparkles,
} from "lucide-react-native";

interface OrderStatusProps {
  status: StatusEnum;
}

export function OrderStatus({ status }: OrderStatusProps) {
  const config = {
    [StatusEnum.PENDING_PAYMENT]: {
      label: "Attente Paiement",
      color: "text-amber-400 bg-amber-400/10 border-amber-400/20",
      icon: Clock,
    },
    [StatusEnum.RECEIVED]: {
      label: "Reçue",
      color: "text-sky-400 bg-sky-400/10 border-sky-400/20",
      icon: Sparkles,
    },
    [StatusEnum.PREPARING]: {
      label: "En Préparation",
      color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      icon: Flame,
    },
    [StatusEnum.READY_FOR_PICKUP]: {
      label: "Prête en Cuisine",
      color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
      icon: CheckCircle,
    },
    [StatusEnum.IN_DELIVERY]: {
      label: "En cours de livraison",
      color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      icon: Truck,
    },
    [StatusEnum.DELIVERED]: {
      label: "Livrée",
      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      icon: CheckCircle,
    },
    [StatusEnum.CANCELLED]: {
      label: "Annulée",
      color: "text-rose-400 bg-rose-400/10 border-rose-400/20",
      icon: ShieldAlert,
    },
  };

  const current = config[status] || {
    label: "Statut Inconnu",
    color: "text-white/40 bg-white/5 border-white/10",
    icon: Clock,
  };

  const Icon = current.icon;

  return (
    <Text
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${current.color}`}
    >
      <Icon size={12} />
      {current.label}
    </Text>
  );
}
