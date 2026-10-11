// src/features/service/components/ServicePayment.tsx
import { View, Text, Pressable } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  orderId: Id<"orders">;
  onSuccess?: () => void;
}

export function ServicePayment({ isOpen, onClose, amount, currency }: Props) {
  if (!isOpen) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
      }}
    >
      <View
        style={{
          width: "90%",
          maxWidth: 420,
          padding: 24,
          borderRadius: 20,
          backgroundColor: "#0D1117",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
          Paiement en cours d'intégration
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            marginTop: 8,
            lineHeight: 18,
          }}
        >
          Le paiement de {amount.toLocaleString()} {currency} sera disponible
          très bientôt sur DébrouillePay.
        </Text>

        <Pressable
          onPress={onClose}
          style={{
            marginTop: 20,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.08)",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Fermer</Text>
        </Pressable>
      </View>
    </View>
  );
}
