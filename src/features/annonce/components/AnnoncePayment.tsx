// src/features/annonce/components/AnnoncePayment.tsx
//
// SÉCURITÉ : `api.payments.processPayment` a été neutralisé.
// Ce composant affiche un message d'indisponibilité en attendant sa
// migration vers le Payment Core (createPaymentIntent + startPayment).

import { View, Text } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  orderId: Id<"orders">;
  amount: number;
  currency: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function AnnoncePayment({ amount, currency }: Props) {
  return (
    <View
      style={{
        padding: 20,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
        Paiement en cours d'intégration
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          marginTop: 6,
          lineHeight: 18,
        }}
      >
        Le paiement de {amount.toLocaleString()} {currency} sera disponible très
        bientôt sur DébrouillePay.
      </Text>
    </View>
  );
}
