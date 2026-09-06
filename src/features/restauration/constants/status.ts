export interface StatusDisplay {
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const ORDER_STATUS_CONFIGS: Record<string, StatusDisplay> = {
  pending_payment: {
    label: "Attente de Paiement",
    textColor: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
  },
  received: {
    label: "Reçue en cuisine",
    textColor: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/20",
  },
  preparing: {
    label: "En préparation",
    textColor: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/20",
  },
  ready_for_pickup: {
    label: "Prête à emporter",
    textColor: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    borderColor: "border-indigo-400/20",
  },
  in_delivery: {
    label: "Livreur en route",
    textColor: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/20",
  },
  delivered: {
    label: "Livrée et acquittée",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  cancelled: {
    label: "Commande Annulée",
    textColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
};
