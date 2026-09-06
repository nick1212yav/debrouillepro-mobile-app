import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { Pressable, View, Text, TextInput } from "react-native";

// src/features/marketplace/components/RefundSheet.tsx
import { useState, useEffect } from "react";
import { X, ArrowLeft, Loader2 } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefundSheetProps {
  isOpen: boolean;
  orderId: Id<"orders">;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Données simulées ────────────────────────────────────────────────────────

const MOCK_ORDER = {
  _id: "order_123",
  totalAmount: 15000,
  currency: "XAF",
  status: "delivered",
};

// ─── Stubs ───────────────────────────────────────────────────────────────────

// ✅ Stub pour la requête getOrder
const useOrderStub = (orderId: Id<"orders"> | undefined) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      const timer = setTimeout(() => {
        setData(MOCK_ORDER);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [orderId]);

  return { data, loading };
};

// ✅ Stub pour la mutation requestRefund
const requestRefundStub = async (args: any) => {
  console.log("[RefundSheet] requestRefund stub", args);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { success: true };
};

// ─── Composant ───────────────────────────────────────────────────────────────

const REFUND_REASONS = [
  { value: "not_as_described", label: "Produit non conforme" },
  { value: "late_delivery", label: "Livraison trop tardive" },
  { value: "canceled", label: "Annulation de commande" },
  { value: "damaged", label: "Produit endommagé" },
  { value: "other", label: "Autre" },
];

export function RefundSheet({
  isOpen,
  orderId,
  onClose,
  onSuccess,
}: RefundSheetProps) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Utilisation du stub pour la requête
  const { data: orderData, loading: orderLoading } = useOrderStub(
    isOpen ? orderId : undefined,
  );

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setComment("");
      setAmount("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!reason) {
      UIService.openToast("Veuillez sélectionner un motif de remboursement", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ Appel du stub
      await requestRefundStub({
        orderId,
        reason,
        comment: comment.trim() || undefined,
        amount: amount ? parseFloat(amount) : undefined,
      });
      UIService.openToast("Votre demande de remboursement a été envoyée.", "success");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la demande de remboursement:", error);
      UIService.openToast("Erreur lors de l'envoi. Veuillez réessayer.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <View className="flex flex-col gap-0">
      {/* En‑tête */}
      <View className="flex items-center gap-3 mb-4">
        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={16} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-base flex-1">
          Demande de remboursement
        </Text>
        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <X size={16} className="text-white/60" />
        </Pressable>
      </View>

      {/* Corps du formulaire */}
      <View
        className="space-y-4 overflow-y-auto"
        style={{ maxHeight: "calc(90vh - 200px)" }}
      >
        {orderLoading ? (
          <View className="flex items-center gap-2 text-white/40 text-sm">
            <Loader2 size={14} className="animate-spin" />
            <Text>Chargement de la commande...</Text></View>
        ) : orderData ? (
          <View className="text-white/60 text-sm space-y-1">
            <Text>Commande #{orderData._id}</Text>
            <Text>
              Total : {orderData.totalAmount} {orderData.currency}
            </Text>
            <Text>Statut : {orderData.status}</Text>
          </View>
        ) : (
          <View className="text-white/40 text-sm">
            <Text>Informations de commande non disponibles</Text></View>
        )}

        {/* Motif */}
        <View className="space-y-1">
          <Text className="text-xs text-white/60 font-medium">
            Motif de remboursement <Text className="text-red-400">*</Text>
          </Text>
          <View
            className="rounded-2xl p-3.5"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <Picker
             
              onValueChange={(val) => setReason(val)}
              className="w-full bg-transparent text-white text-sm outline-none"
             selectedValue={reason}>
              <Picker.Item label="Sélectionnez un motif" value="" />
              {REFUND_REASONS.map((r) => (
                <Picker.Item label={`${r.label}`} value={r.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Commentaire */}
        <View className="space-y-1">
          <Text className="text-xs text-white/60 font-medium">
            Commentaire (optionnel)
          </Text>
          <View
            className="rounded-2xl p-3.5"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <TextInput
              value={comment}
              onChangeText={(text) => setComment(text)}
              placeholder="Précisez les raisons de votre demande..."
             
              className="w-full bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
             multiline textAlignVertical="top"/>
          </View>
        </View>

        {/* Montant (optionnel) */}
        <View className="space-y-1">
          <Text className="text-xs text-white/60 font-medium">
            Montant du remboursement (optionnel)
          </Text>
          <View
            className="rounded-2xl p-3.5"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <TextInput
             
              value={amount}
              onChangeText={(text) => setAmount(text)}
              placeholder="Laissez vide pour le montant total"
              min={0}
              step={0.01}
              className="w-full bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
             keyboardType="numeric"/>
          </View>
        </View>

        {/* Bouton de soumission */}
        <Pressable
          disabled={isSubmitting || !reason}
          onPress={handleSubmit}
          className="w-full py-4 rounded-3xl text-white font-bold text-sm mt-3 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{  }}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Envoi en cours..." : "Soumettre la demande"}
        </Pressable>
      </View>
    </View>
  );
}
