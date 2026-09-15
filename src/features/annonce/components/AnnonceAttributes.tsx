import { View, Text } from "react-native";
import type { Annonce } from "../types";
import { formatPrice } from "@/lib/utils";

interface Props {
  annonce: Annonce;
}

export function AnnonceAttributes({ annonce }: Props) {
  const attributes: { label: string; value: string }[] = [];

  if (annonce.condition) {
    attributes.push({ label: "État", value: annonce.condition });
  }
  if (annonce.warrantyMonths) {
    attributes.push({
      label: "Garantie",
      value: `${annonce.warrantyMonths} mois`,
    });
  }
  if (annonce.deliveryAvailable) {
    attributes.push({
      label: "Livraison",
      value: annonce.deliveryPrice
        ? `${formatPrice(annonce.deliveryPrice, annonce.currency)}`
        : "Disponible",
    });
  }
  if (annonce.negotiable) {
    attributes.push({ label: "Négociable", value: "Oui" });
  }
  if (annonce.isReserved) {
    attributes.push({ label: "Statut", value: "Réservé" });
  }
  if (annonce.isSold) {
    attributes.push({ label: "Statut", value: "Vendu" });
  }

  if (attributes.length === 0) return null;

  return (
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Caractéristiques</Text><View className="gap-2">{attributes.map((attr) => (
          <View key={attr.label} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5">
            <Text className="text-xs text-white/40">{attr.label}</Text>
            <Text className="text-xs text-white/80 font-medium">
              {attr.value}
            </Text>
          </View>
        ))}</View></View>
  );
}
