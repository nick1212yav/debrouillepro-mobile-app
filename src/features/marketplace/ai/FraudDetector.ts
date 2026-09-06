// src/features/marketplace/ai/FraudDetector.ts
import type { Order } from "../types/order.types";

export interface FraudIndicator {
  score: number; // 0-1
  flags: string[];
  level: "safe" | "suspicious" | "high_risk";
}

/**
 * Détecte des comportements frauduleux dans les commandes (ex: multiples commandes du même IP, montants anormaux, etc.)
 * Version simulée.
 */
export function detectFraud(
  order: Order,
  userHistory: Order[],
): FraudIndicator {
  const flags: string[] = [];
  let score = 0;

  // Vérifier les montants extrêmes
  if (order.totalAmount > 1_000_000) {
    flags.push("Montant élevé (>1M)");
    score += 0.3;
  }

  // Vérifier la fréquence des commandes du même utilisateur
  const userOrders = userHistory.filter((o) => o.buyerId === order.buyerId);
  if (userOrders.length > 5) {
    flags.push("Fréquence élevée de commandes");
    score += 0.2;
  }

  // Vérifier les commandes avec des adresses de livraison différentes
  const uniqueAddresses = new Set(userOrders.map((o) => o.deliveryAddress));
  if (uniqueAddresses.size > 3) {
    flags.push("Multiples adresses de livraison");
    score += 0.2;
  }

  // Vérifier la quantité (ex: commandes multiples du même produit)
  const sameProductOrders = userOrders.filter(
    (o) => o.productId === order.productId,
  );
  if (sameProductOrders.length > 3) {
    flags.push("Commandes répétées du même produit");
    score += 0.3;
  }

  const level: FraudIndicator["level"] =
    score > 0.6 ? "high_risk" : score > 0.3 ? "suspicious" : "safe";

  return {
    score: Math.min(score, 1),
    flags,
    level,
  };
}
