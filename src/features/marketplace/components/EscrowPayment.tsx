// src/features/marketplace/components/EscrowPayment.tsx
//
// SÉCURITÉ : la chaîne escrow a été neutralisée côté backend.
// Ce composant présente l'état d'indisponibilité en conservant l'interface
// (Props) nécessaire à sa future migration vers le Payment Core :
//
//   createPaymentIntent(type: "merchant_payment")
//       ↓
//   startPayment (provider)
//       ↓
//   finalizeProviderSuccess → escrow state
//       ↓
//   release (via verified provider event)

import { View, Text, Pressable } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface EscrowPaymentProps {
  amount: number;
  currency: string;
  sellerId: Id<"users">;
  orderId?: Id<"orders">;
  productId?: Id<"products">;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function EscrowPayment({
  amount,
  currency,
  onCancel,
  onClose,
}: EscrowPaymentProps) {
  return (
    <View
      style={{
        padding: 24,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
        Paiement sécurisé en cours d'intégration
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 13,
          marginTop: 8,
          lineHeight: 18,
        }}
      >
        Le paiement sécurisé de {amount.toLocaleString()} {currency} sera
        disponible très bientôt. Les fonds ne seront libérés qu'après validation
        de la réception du bien ou du service.
      </Text>

      <Pressable
        onPress={() => {
          onCancel?.();
          onClose?.();
        }}
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
  );
}
