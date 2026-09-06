import { Text, View } from "react-native";
import React from "react";
import { AlertCircle, CheckCircle2, Clock, XCircle, Play } from "lucide-react-native";

export type BookingStatusType =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rejected";

interface BookingStatusProps {
  status: BookingStatusType;
  className?: string;
}

const STATUS_CONFIG: Record<
  BookingStatusType,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  pending: {
    label: "En attente",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmé",
    className: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Annulé",
    className: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
    icon: XCircle,
  },
  completed: {
    label: "Terminé",
    className:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    icon: Play,
  },
  rejected: {
    label: "Refusé",
    className: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
    icon: AlertCircle,
  },
};

export const BookingStatus: React.FC<BookingStatusProps> = ({
  status,
  className = "",
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <View
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className} ${className}`}
    >
      <Icon size={12} />
      <Text>{config.label}</Text>
    </View>
  );
};
