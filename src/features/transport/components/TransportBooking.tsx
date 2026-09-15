import { View, Text } from "react-native";

// src/features/transport/components/TransportBooking.tsx
import { useState } from "react";
import { CheckCircle2, AlertCircle, Trash2 } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TransportBookingProps {
  origin: string;
  destination: string;
  departureTime: string;
  seats: number;
  totalAmount: number;
  currency: string;
  status: string;
  onCancel: () => Promise<void> | void;
}

export function TransportBooking({
  origin,
  destination,
  departureTime,
  seats,
  totalAmount,
  currency,
  status,
  onCancel,
}: TransportBookingProps) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancelClick = async () => {
    setCancelling(true);
    try {
      await onCancel();
      toast.success("Réservation annulée avec succès [2].");
    } catch {
      toast.error("Une erreur s'est produite lors de l'annulation.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center justify-between"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Votre reçu numérique [2]
        </Text><Text className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={10} />Réservation {status}[2]
        </Text></View><View className="space-y-2 border-b border-white/5 pb-4"><View className="flex items-center justify-between text-xs"><Text className="text-white/40">Itinéraire :</Text><Text className="text-white font-bold">{origin}→ {destination}</Text></View><View className="flex items-center justify-between text-xs"><Text className="text-white/40">Départ :</Text><Text className="text-white font-bold">{departureTime}</Text></View><View className="flex items-center justify-between text-xs"><Text className="text-white/40">Places réservées :</Text><Text className="text-white font-bold">{seats}place{seats > 1 ? "s" : ""}</Text></View></View><View className="flex items-center justify-between text-sm"><Text className="text-white/40">Montant acquitté :</Text><Text className="text-white font-black text-base">{totalAmount.toLocaleString()}{currency}[2]
        </Text></View>{status !== "cancelled" && (
        <Button
          onPress={handleCancelClick}
          disabled={cancelling}
          variant="outline"
          className="w-full h-11 rounded-xl text-xs font-bold gap-1.5 text-red-400 border-red-500/10"
        >
          <Trash2 size={14} />
          {cancelling ? "Annulation en cours..." : "Annuler ma réservation [2]"}
        </Button>
      )}</View>
  );
}
