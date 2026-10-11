// src/features/marketplace/components/RefundSheet.tsx
//
// SÉCURITÉ : la chaîne refund a été neutralisée côté backend.
// Ce composant présente l'état d'indisponibilité en conservant l'interface
// (Props) nécessaire à sa future migration vers le Payment Core :
//
//   createPaymentIntent(type: "refund")
//       ↓
//   startPayment (provider refund)
//       ↓
//   verified provider event
//       ↓
//   ledger refund → order state

import { View, Text, Pressable } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface RefundSheetProps {
  isOpen: boolean;
  orderId: Id<"orders">;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RefundSheet({ isOpen, onClose }: RefundSheetProps) {
  if (!isOpen) return null;

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
        Remboursement en cours d'intégration
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: 13,
          marginTop: 8,
          lineHeight: 18,
        }}
      >
        Les demandes de remboursement seront disponibles très bientôt. Contactez
        le support pour toute demande urgente.
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
  );
}
